/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import { unlink } from 'fs-extra'

import Config from '../src/config'
import PurpleBot from '../src/bot'
import { Plugin } from '../src/plugins'
import Database from '../src/sqlite'

/**
 * Plugin for tracking karma.
 */
export default class KarmaPlugin implements Plugin {
  bot: PurpleBot
  config: Config
  db: Database

  /**
   * Asynchronously loads the database.
   */
  async load (bot: PurpleBot, config?: Config): Promise<void> {
    this.bot = bot
    this.config = config || new Config()
    this.installHooks()
    await this.loadDatabase()
  }

  /**
   * Outputs karma for a name.
   */
  respond (nick: string, to: string, term: string, karma: number): void {
    if (typeof this.bot.say === 'function') {
      const response = `${nick}: karma for ${term} is now ${karma}.`
      this.bot.say(to, response)
    }
  }

  /**
   * Outputs for a name without karma.
   */
  respondNoKarma (nick: string, to: string, term: string): void {
    if (typeof this.bot.say === 'function') {
      const response = `${nick}: There is no karma for ${term}.`
      this.bot.say(to, response)
    }
  }

  /**
   * Return the path to the Karma database.
   *
   * @readonly
   */
  get databasePath (): string {
    return this.config.path('karma.db')
  }

  /**
   * Replaces the current database with an empty one.
   */
  async resetDatabase (): Promise<void> {
    if (this.db) {
      await this.db.close()
    }

    await new Promise((resolve, reject) => {
      unlink(this.databasePath, err => {
        if (err) reject(err)
        else resolve(err)
      })
    })

    await this.loadDatabase()
  }

  /**
   * Retrieves the karma for a `name` if it exists.
   */
  async get (name: string): Promise<any> {
    const sql = 'SELECT * FROM karma_view WHERE name = ?'
    return this.db.get(sql, name)
  }

  /**
   * Increase or decrease the given `name`'s karma by `points`.
   * The `name` will be automatically created if it does not already exist.
   *
   * @returns the updated number of points
   */
  async updateBy (name: string, points: number): Promise<number> {
    if (!points) return null

    await this.db.exec('BEGIN')

    const sqlInsert = 'INSERT OR IGNORE INTO karma (name) VALUES (?1)'
    await this.db.run(sqlInsert, name)

    const sqlUpdate = (points >= 0)
      ? 'UPDATE karma SET increased = increased+?2 WHERE name = ?1'
      : 'UPDATE karma SET decreased = decreased+?2 WHERE name = ?1'
    await this.db.run(sqlUpdate, name, Math.abs(points))

    const sqlSelect = 'SELECT points FROM karma_view WHERE name = ?1'
    const result = await this.db.get(sqlSelect, name)

    await this.db.exec('END')

    return result.points
  }

  async top (limit: number = 5): Promise<any[]> {
    const sql = 'SELECT * FROM karma_view LIMIT ?'
    const results = await this.db.all(sql, limit)
    return results.map(({ name, increased, decreased, points }, index) => {
      return { index, name, increased, decreased, points }
    })
  }

  /**
   * Responds to `message#` from the client.
   *
   * @fires PurpleBot#karma.respond
   */
  async onMessage (nick: string, to: string, text: string): Promise<void> {
    const result = /(\w+)(\+\+|--)(\d*)(?!\w)/.exec(text)
    if (result === null) return

    const term = result[1]
    const dir = (result[2][0] === '-') ? -1 : +1
    const points = (result[3] != null) ? Number.parseInt(result[3]) || 1 : 1

    const karma = await this.updateBy(term, dir * points)

    this.bot.emit('karma.respond', nick, to, term, karma)
  }

  /**
   * Install hooks on the bot.
   */
  private installHooks (): void {
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
        this.respondNoKarma(nick, to, term)
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

  private async loadDatabase (): Promise<void> {
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

    this.db = await Database.open(this.databasePath)
    await this.db.exec(sql)
  }
}
