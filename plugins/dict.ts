/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import Database from '../src/sqlite'
import * as _ from 'lodash'

import Config, { FileConfig } from '../src/config'
import PurpleBot, { Context } from '../src/bot'
import { Plugin } from '../src/plugins'

/**
 * Plugin for user-defined terms.
 *
 * You may use it as a terms dictionary.
 */
export default class DictPlugin implements Plugin {
  protected static matchQuery = /^\s*([\w- ]*[\w-]+?)\?+\s*$/

  readonly name = 'dict'

  bot: PurpleBot
  config: FileConfig
  databasePath: string
  db: Database

  /**
   * Asynchronously loads the needed resources for this plugin.
   *
   * @listens message#
   * @listens pm
   * @listens command
   */
  async load (bot: PurpleBot, config: Config): Promise<void> {
    if (!(config instanceof FileConfig)) throw new Error()

    this.bot = bot
    this.config = config
    this.databasePath = this.config.directory('dict.db')

    await this.loadDatabase()
    this.installHooks()
  }

  async reset (): Promise<void> {
    return this.db.run('DROP TABLE IF EXISTS dict')
  }

  /**
   * Adds a value for `key`.
   */
  async add (key: string, value: string, user?: string): Promise<void> {
    const sql = 'INSERT INTO dict (key, value, user) VALUES (?, ?, ?)'
    await this.db.run(sql, key, value, user)
  }

  /**
   * Removes a value for `key`.
   */
  async remove (key: string, valueId: number): Promise<boolean> {
    if (valueId <= 0) return false

    await this.db.run('BEGIN')

    const results = await this.values(key)
    if (valueId > results.length) return false

    const id = results[valueId - 1].id
    const sql = 'DELETE FROM dict WHERE id = ?'
    await this.db.run(sql, id)

    await this.db.run('END')

    return true
  }

  /**
   * Retrieve a random value for `key`, if it exists.
   */
  async value (name: string): Promise<any> {
    const sql = 'SELECT * FROM dict WHERE key = ? ORDER BY RANDOM() LIMIT 1'
    const value = await this.db.get(sql, name)
    return value
  }

  /**
   * Retrieve all values for `key`, if they exist.
   */
  async values (name: string): Promise<any> {
    const sql = 'SELECT * FROM dict WHERE key = ? ORDER BY timestamp, value'
    const results = await this.db.all(sql, name)
    return results
  }

  toString (): string {
    return `[DictPlugin ${this.databasePath}]`
  }

  protected async handleMessage (context: Context, text: string): Promise<void> {
    const result = DictPlugin.matchQuery.exec(text)
    if (result == null) return

    const key = result[1]
    const term = await this.value(key)
    if (term == null) return
  }

  /**
   * @fires dict.respond
   */
  protected async handleLearn (context: Context, ...args: string[]): Promise<void> {
    if (args.length < 3) {
      // TODO: print usage info
      return
    }

    const isIndex = _.findIndex(args, arg => arg.toLowerCase() === 'is')
    if (isIndex < 1 || isIndex === args.length - 1) {
      // TODO: print usage info
      return
    }

    const key = args.slice(0, isIndex).join(' ')
    const value = args.slice(isIndex + 1).join(' ')
    await this.add(key, value, context.nick)

    // TODO: use a specific response
  }

  private async loadDatabase (): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS dict (
        id          INTEGER PRIMARY KEY,
        key         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        value       TEXT    NOT NULL UNIQUE,
        user        TEXT                    COLLATE NOCASE,
        timestamp   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      PRAGMA busy_timeout = 0;
    `

    await this.config.ensureDir()
    this.db = await Database.open(this.databasePath)
    await this.db.exec(sql)
  }

  private installHooks (): void {
    this.bot.on('message#', (nick, to, text, message) => {
      this.handleMessage({nick, to}, text)
    })

    this.bot.on('pm', (nick, text, message) => {
      this.handleMessage({nick, to: nick}, text)
    })

    this.bot.on('command', (context, command, ...args) => {
      if (command.toLowerCase() === 'learn') {
        this.handleLearn(context, ...args)
      }
    })
  }
}
