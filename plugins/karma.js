/**
 * @module PurpleBot/plugins
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'

import Config from '../src/config'

export class KarmaPlugin {
  constructor (bot) {
    this.bot = bot
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

    return Config.database()
      .then(db => {
        this.db = db
        return db
      })
      .then(db => db.run(sql))
      .catch(err => console.error(err.stack))
  }

  async addKarma (name, user = null, points = 1) {
    const sql = 'INSERT INTO karma (name, user, points) VALUES (?, ?, ?);'
    return Promise.resolve()
      .then(() => this.db.run(sql, name, user, points))
      .then(() => this.displayKarma(name))
  }

  async getKarma (name) {
    const sql = 'SELECT total FROM karma_total WHERE name = ?;'
    return Promise.resolve()
      .then(() => this.db.get(sql, name))
      .then(result => result.total)
  }
}

export default async function init (bot) {
  const plugin = new KarmaPlugin(bot)
  await plugin.database()
  return plugin
}
