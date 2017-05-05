/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import sqlite from 'sqlite'

import Config from '../src/config'

/**
 * Plugin for user-defined terms.
 *
 * @implements {Plugin}
 */
class DictPlugin {
  /**
   * Creates an instance of DictPlugin.
   *
   * @param {any} bot
   * @param {Config} config
   *
   * @memberof DictPlugin
   */
  constructor (bot, config) {
    this.bot = bot
    this.config = config || new Config()
    this.databasePath = this.config.path('dict.db')
  }

  /**
   * Asynchronously loads the needed resources for this plugin.
   *
   * @returns {Promise<void>}
   *
   * @memberof DictPlugin
   */
  async load () {
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
    this.db = await sqlite.open(this.databasePath)
    await this.db.exec(sql)

    this.bot.on('message#', (nick, to, text, message) => {
      this.onMessage(nick, to, text)
    })
  }

  async onMessage (nick, to, text) {
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
   * @param {string} key
   * @param {string} value
   * @param {string} [user=null]
   *
   * @memberof DictPlugin
   */
  async add (key, value, user = null) {
    const sql = 'INSERT INTO definition (key, value, user) VALUES (?, ?, ?)'
    return this.db.run(sql, key, value, user)
  }

  /**
   * Removes a definition for `key`.
   *
   * @param {string} key
   * @param {number} valueId
   * @returns {Promise<boolean>}
   *
   * @memberof DictPlugin
   */
  async remove (key, valueId) {
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
   * @param {string} key
   *
   * @memberof DictPlugin
   */
  async definition (name) {
    const sql = 'SELECT * FROM definition WHERE key = ? ORDER BY RANDOM() LIMIT 1'
    const value = await this.db.get(sql, name)
    return value
  }

  /**
   * Retrieve all definitions for `key`, if they exist.
   *
   * @param {string} name
   *
   * @memberof DictPlugin
   */
  async definitions (name) {
    const sql = 'SELECT * FROM definition WHERE key = ? ORDER BY timestamp, value'
    const definitions = await this.db.all(sql, name)
    return definitions
  }
}

async function init (bot, config) {
  const plugin = new DictPlugin(bot, config)
  await plugin.load()
  return plugin
}

export default init
export { DictPlugin }
