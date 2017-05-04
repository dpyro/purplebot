/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import fs from 'fs-extra'
import sqlite from 'sqlite'

import Config from '../src/config'

class KarmaPlugin {
  constructor (bot, config) {
    this.bot = bot
    this.config = config || new Config()
    this._installHooks()
  }

  _installHooks () {
    this.bot.on('message#', (nick, to, text, message) => {
      this.onMessage(nick, to, text)
    })

    this.bot.on('karma.respond', (nick, to, term, karma) => {
      this.respond(nick, to, term, karma)
    })

    this.bot.on('karma.get', (nick, to, term, karma) => {
      if (karma != null) {
        this.respond(nick, to, term, karma)
      } else {
        this.responseNoKarma(nick, to, term)
      }
    })

    this.bot.on('command', async (context, command, ...args) => {
      if (command !== 'karma') return

      if (args.length < 1) {
        // TODO: print usage or help
        return
      }

      const term = args.shift()
      const result = await this.get(term)
      const { nick, to } = context

      const karma = (result != null) ? result.points : null
      this.bot.emit('karma.get', nick, to, term, karma)
    })
  }

  async onMessage (nick, to, text) {
    const result = /(\w+)(\+\+|--)(\d*)(?!\w)/.exec(text)
    if (result === null) return

    const term = result[1]
    const dir = (result[2][0] === '-') ? -1 : +1
    const points = (result[3] != null) ? Number.parseInt(result[3]) || 1 : 1
    const karma = await this.updateBy(term, dir * points)

    this.bot.emit('karma.respond', nick, to, term, karma)
  }

  async respond (nick, to, term, karma) {
    if (typeof this.bot.say === 'function') {
      const response = `${nick}: karma for ${term} is now ${karma}.`
      await this.bot.say(to, response)
    }
  }

  async respondNoKarma (nick, to, term) {
    if (typeof this.bot.say === 'function') {
      const response = `${nick}: There is no karma for ${term}.`
      await this.bot.say(to, response)
    }
  }

  get databasePath () {
    return this.config.path('karma.db')
  }

  async load () {
    const sql = `
      CREATE TABLE IF NOT EXISTS karma (
        id        INTEGER PRIMARY KEY,
        name      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        increased INTEGER NOT NULL DEFAULT 0 CHECK (increased >= 0),
        decreased INTEGER NOT NULL DEFAULT 0 CHECK (decreased >= 0)
      );

      CREATE VIEW IF NOT EXISTS karma_view AS
        SELECT *, increased-decreased AS points
        FROM karma
        ORDER BY points, name DESC;

      PRAGMA busy_timeout = 0;
    `

    await this.config.ensureDir()
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

    await this.load()
  }

  async get (name) {
    const sql = 'SELECT * FROM karma_view WHERE name = ?'
    await this.db.get(sql, name)
  }

  async updateBy (name, points) {
    if (points == null) return null

    await this.db.exec('BEGIN')

    const sqlInsert = 'INSERT OR IGNORE INTO karma (name) VALUES (?1)'
    await this.db.run(sqlInsert, name)

    if (points > 0) {
      const sqlUpdate = 'UPDATE karma SET increased = increased+?2 WHERE name = ?1'
      await this.db.run(sqlUpdate, name, points)
    } else if (points < 0) {
      const sqlUpdate = 'UPDATE karma SET decreased = decreased+?2 WHERE name = ?1'
      await this.db.run(sqlUpdate, name, -points)
    }

    const sqlSelect = 'SELECT points FROM karma_view WHERE name = ?1'
    const result = await this.db.get(sqlSelect, name)

    await this.db.exec('END')

    return result.points
  }

  async top (limit = 5) {
    const sql = 'SELECT * FROM karma_view LIMIT ?;'
    const results = await this.db.all(sql, limit)
    await results.map(({ name, increased, decreased, points }, index) => {
      return { index, name, increased, decreased, points }
    })
  }
}

async function init (...args) {
  const plugin = new KarmaPlugin(...args)
  await plugin.load()
  return plugin
}

export default init
export { KarmaPlugin }
