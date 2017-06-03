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
import { User } from '../src/user'

export class DictEntry {
  id?: number
  key: string
  value: string
  userId?: number
  userName?: string
  timestamp?: Date

  constructor (key: string, value: string) {
    this.key = key
    this.value = value
  }

  static fromRow (row: any): DictEntry {
    const entry = new DictEntry(row['key'], row['value'])
    entry.id = row['id']
    if (row['timestamp'] != null) {
      entry.timestamp = new Date(row['timestamp'])
    }
    entry.userId = row['user_id']
    entry.userName = row['user_name']

    return entry
  }
}

/**
 * Plugin for user-defined terms.
 *
 * You may use it as a terms dictionary.
 */
export default class DictPlugin implements Plugin {
  protected static matchQuery = /^\s*([\w- ]*[\w-]+?)\?+\s*$/

  readonly name = 'dict'
  bot: PurpleBot
  config: Config
  databasePath: string
  db: Database

  /**
   * Asynchronously loads the needed resources for this plugin.
   *
   * @listens message#
   * @listens pm
   * @listens command
   * @throws Error
   */
  async load (bot: PurpleBot): Promise<void> {

    this.bot = bot
    this.config = bot.config
    if (this.config instanceof FileConfig) {
      this.databasePath = this.config.path('dict.db')
    } else {
      this.databasePath = ':memory:'
    }

    await this.loadDatabase()
    this.installHooks()
  }

  async reset (): Promise<void> {
    return this.db.run('DROP TABLE IF EXISTS dict')
  }

  /**
   * Adds a value for `key`.
   */
  async add (key: string, value: string, user?: User | string | number | null): Promise<void> {
    let userId
    let userName
    if (user != null) {
      if (user instanceof User) {
        userId = user.id
        userName = user.name
      } else if (typeof user === 'number') {
        userId = user
        const result = await this.bot.userDb.getUser(userId)
        if (result !== null) {
          userName = result.name
        }
      } else if (typeof user === 'string') {
        userName = user
        const result = await this.bot.userDb.getUser(userName)
        if (result !== null) {
          userId = result.id
        }
      } else {
        throw new Error()
      }
    }

    const sql = 'INSERT INTO dict (key, value, user_id, user_name) VALUES (?, ?, ?, ?)'
    await this.db.run(sql, key, value, userId, userName)
  }

  /**
   * Removes a value for `key`.
   */
  async remove (key: string, valueId: number): Promise<boolean> {
    if (valueId <= 0) return false

    await this.db.run('BEGIN')

    const results = await this.entries(key)
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
  async entry (name: string): Promise<DictEntry | null> {
    const sql = 'SELECT * FROM dict WHERE key = ? ORDER BY RANDOM() LIMIT 1'
    const result = await this.db.get(sql, name)

    if (result === undefined) {
      return null
    }

    return DictEntry.fromRow(result)
  }

  /**
   * Retrieve all values for `key`, if they exist.
   */
  async entries (name: string): Promise<DictEntry[]> {
    const sql = 'SELECT * FROM dict WHERE key = ? ORDER BY timestamp, value'
    const results = await this.db.all(sql, name)
    const entries = results.map(result => DictEntry.fromRow(result))
    return entries
  }

  toString (): string {
    return `[DictPlugin ${this.databasePath}]`
  }

  protected async handleMessage (context: Context, text: string): Promise<void> {
    const result = DictPlugin.matchQuery.exec(text)
    if (result === null) return

    const key = result[1]
    const term = await this.entry(key)
    if (term == null) return

    // TODO: use a specific response
    this.bot.emit('dict.respond', context, key, term.value)
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

    const user = await context.getUser(this.bot.userDb)
    await this.add(key, value, user)

    // TODO: use a specific response
    this.bot.emit('dict.respond', context, key, value)
  }

  private async loadDatabase (): Promise<void> {
    const sql = `
      PRAGMA auto_vacuum = FULL;
      PRAGMA busy_timeout = 0;
      PRAGMA user_version = 1;

      CREATE TABLE IF NOT EXISTS dict (
        id          INTEGER PRIMARY KEY,
        key         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        value       TEXT    NOT NULL UNIQUE,
        user_id     INTEGER,
        user_name   TEXT,
        timestamp   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `

    if (this.config instanceof FileConfig) {
      await this.config.ensureDir()
    }
    this.db = await Database.open(this.databasePath)
    await this.db.exec(sql)
  }

  private installHooks (): void {
    this.bot.on('message#', (nick, to, text, message) => {
      const context = new Context()
      context.nick = nick
      context.user = message.user
      context.host = message.host
      context.to = to

      return this.handleMessage(context, text)
    })

    this.bot.on('pm', (nick, text, message) => {
      const context = new Context()
      context.nick = nick
      context.user = message.user
      context.host = message.host
      context.to = nick
      return this.handleMessage(context, text)
    })

    this.bot.on('command', (context, command, ...args) => {
      if (command.toLowerCase() === 'learn') {
        return this.handleLearn(context, ...args)
      }
    })
  }
}
