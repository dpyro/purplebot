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
      CREATE TABLE IF NOT EXISTS term (
        id          INTEGER PRIMARY KEY,
        name        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        definition  TEXT    NOT NULL UNIQUE,
        user        TEXT                    COLLATE NOCASE,
        timestamp   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      PRAGMA busy_timeout = 0;
    `

    await this.config.ensureDir()
    this.db = await sqlite.open(this.databasePath)
    await this.db.exec(sql)
  }
}

async function init (...args) {
  const plugin = new DictPlugin(...args)
  await plugin.load()
  return plugin
}

export default init
export { DictPlugin }
