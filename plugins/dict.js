/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import sqlite from 'sqlite'

import Config from '../src/config'

class DictPlugin {
  constructor (bot, config) {
    this.bot = bot
    this.config = config || new Config()
    this.databasePath = this.config.path('dict.db')
  }

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

  async add (key, value, user = null) {
    const sql = 'INSERT INTO definition (key, value, user) VALUES (?, ?, ?)'
    return this.db.run(sql, key, value, user)
  }

  async remove (key, valueId) {
    if (valueId <= 0) return false

    await this.db.run('BEGIN')
    const results = this.definitions(key)
    if (valueId > results.length) return false
    const value = results[valueId - 1].value
    const sql = 'DELETE FROM definition WHERE key = ?, value = ?'
    return this.db.run(sql, key, value)
  }

  async definition (name) {
    const sql = 'SELECT * FROM definition WHERE key = ? ORDER BY RANDOM() LIMIT 1'
    return this.db.get(sql, name)
  }

  async definitions (name) {
    const sql = 'SELECT * FROM definition WHERE key = ? ORDER BY timestamp, value'
    return this.db.all(sql, name)
  }
}

async function init (...args) {
  const plugin = new DictPlugin(...args)
  await plugin.load()
  return plugin
}

export default init
export { DictPlugin }
