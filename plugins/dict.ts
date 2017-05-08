/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import Database from '../src/sqlite'

import Config from '../src/config'
import PurpleBot from '../src/bot'
import { Plugin } from '../src/plugins'

/**
 * Plugin for user-defined terms.
 *
 * @memberof module:purplebot
 */
export default class DictPlugin implements Plugin {
  bot: PurpleBot
  config: Config
  databasePath: string
  db: Database

  /**
   * Asynchronously loads the needed resources for this plugin.
   *
   * @memberof DictPlugin
   */
  async load (bot: PurpleBot, config?: Config): Promise<void> {
    this.bot = bot
    this.config = config || new Config()
    this.databasePath = this.config.path('dict.db')

    const sql = `
      CREATE TABLE IF NOT EXISTS definition (
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

    this.bot.on('message#', (nick, to, text, message) => {
      this.onMessage(nick, to, text)
    })
  }

  /**
   *
   *
   * @fires PurpleBot#dict.respond
   * @memberof DictPlugin
   */
  async onMessage (nick: string, to: string, text: string): Promise<void> {
    const result = /([\w-]+?)\?+(?!\S)/.exec(text)
    if (result == null) return

    const name = result[1]
    const term = await this.definition(name)
    const definition = (term != null) ? term.definition : null

    this.bot.emit('dict.respond', nick, to, name, definition)
  }

  /**
   * Adds a definition for `key`.
   *
   * @memberof DictPlugin
   */
  async add (key: string, value: string, user: string = null) {
    const sql = 'INSERT INTO definition (key, value, user) VALUES (?, ?, ?)'
    return this.db.run(sql, key, value, user)
  }

  /**
   * Removes a definition for `key`.
   *
   * @memberof DictPlugin
   */
  async remove (key: string, valueId: number): Promise<boolean> {
    if (valueId <= 0) return false

    await this.db.run('BEGIN')

    const results = await this.definitions(key)
    if (valueId > results.length) return false

    const id = results[valueId - 1].id
    const sql = 'DELETE FROM definition WHERE id = ?'
    await this.db.run(sql, id)

    await this.db.run('END')

    return true
  }

  /**
   * Retrieve a random definition for `key`, if it exists.
   *
   * @memberof DictPlugin
   */
  async definition (name: string): Promise<any> {
    const sql = 'SELECT * FROM definition WHERE key = ? ORDER BY RANDOM() LIMIT 1'
    const value = await this.db.get(sql, name)
    return value
  }

  /**
   * Retrieve all definitions for `key`, if they exist.
   *
   * @memberof DictPlugin
   */
  async definitions (name: string): Promise<any> {
    const sql = 'SELECT * FROM definition WHERE key = ? ORDER BY timestamp, value'
    const definitions = await this.db.all(sql, name)
    return definitions
  }
}
