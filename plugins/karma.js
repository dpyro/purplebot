/**
 * @module PurpleBot/plugins
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import fs from 'fs-extra'
import sqlite from 'sqlite'

import Config from '../src/config'

export class KarmaPlugin {
  constructor (bot) {
    this.bot = bot
  }

  get databasePath () {
    return Config.path('karma.db')
  }

  async database () {
    const sql = `
      CREATE TABLE IF NOT EXISTS karma (
        id        INTEGER PRIMARY KEY,
        name      TEXT    NOT NULL,
        user      TEXT    COLLATE NOCASE,
        points    INTEGER NOT NULL,
        timestamp TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE VIEW IF NOT EXISTS karma_total AS
        SELECT name, SUM(points) AS total
        FROM karma
        GROUP BY name
        ORDER BY total DESC
      ;
    `

    await fs.ensureDir(Config.path())
    this.db = await sqlite.open(this.databasePath)
    await this.db.exec(sql)
  }

  async resetDatabase () {
    if (this.db) {
      await this.db.close()
    }

    await new Promise((resolve, reject) => {
      fs.unlink(this.databasePath, err => {
        if (err) reject(err)
        else resolve(err)
      })
    })

    await this.database()
  }

  async add (name, user = null, points = 1) {
    const sql = 'INSERT INTO karma (name, user, points) VALUES (?, ?, ?);'
    await this.db.run(sql, name, user, points)
  }

  async get (name) {
    const sql = 'SELECT total FROM karma_total WHERE name = ?;'
    const result = await this.db.get(sql, name)
    return result.total
  }

  async top (limit = 5) {
    const sql = 'SELECT * FROM karma_total LIMIT ?;'
    const results = await this.db.all(sql, limit)
    await results.map(({ name, total }, index) => { return { index, name, total } })
  }
}

export default async function init (bot) {
  const plugin = new KarmaPlugin(bot)
  await plugin.database()
  return plugin
}
