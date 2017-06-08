/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import * as fs from 'fs-extra'
Promise = require('bluebird')

import Config, { FileConfig } from '../src/config'
import PurpleBot, { Context } from '../src/bot'
import { Plugin } from '../src/plugins'
import Database from '../src/sqlite'
import { hasAdmin } from '../src/user'

/**
 * https://github.com/arolson101/typescript-decorators
 *
 * @decorator
 */
function requireDb (
  target: KarmaPlugin,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<any>) {
  const originalMethod = descriptor.value

  descriptor.value = function (this: KarmaPlugin, ...args: any[]) {
    if (this.db === undefined) throw new Error('karma: database unavailable')
    return originalMethod.apply(this, args)
  }

  return descriptor
}

/**
 * Plugin for tracking karma.
 */
export default class KarmaPlugin implements Plugin {
  protected static matchAward = /\s*([\w ]+)(\+{2,}|-{2,})(\d*)(?!\w)/

  readonly name = 'karma'
  bot: PurpleBot
  config: Config
  databasePath: string /* Path to the Karma database. */
  db?: Database

  /**
   * Asynchronously loads the database.
   */
  async load (bot: PurpleBot): Promise<void> {
    this.bot = bot
    this.config = bot.config
    if (this.config instanceof FileConfig) {
      this.databasePath = this.config.path('karma.db')
    } else {
      this.databasePath = ':memory:'
    }

    await this.loadDatabase()
    this.installHooks()
  }

  @requireDb
  async reset (): Promise<void> {
    await this.db!.run('DROP TABLE IF EXISTS karma')
  }

  /**
   * Retrieves the karma for a `name` if it exists.
   */
  @requireDb
  async get (name: string): Promise<any> {
    const sql = 'SELECT * FROM view WHERE name = ?'
    return this.db!.get(sql, name)
  }

  /**
   * Set the karma for a `name` or delete it if it exists.
   */
  @requireDb
  async set (name: string, value: number): Promise<void> {
    if (value > 0) {
      const sql = 'UPDATE karma SET increased = ?, decreased = 0 WHERE name = ?'
      await this.db!.run(sql, name, value, name)
    } else if (value < 0) {
      const sql = 'UPDATE karma SET increased = 0, decreased = ? WHERE name = ?'
      await this.db!.run(sql, name, value, name)
    } else {
      const sql = 'DELETE FROM karma WHERE name = ?'
      await this.db!.run(sql, name, name)
    }
  }

  /**
   * Increase or decrease the given `name`'s karma by `points`.
   * The `name` will be automatically created if it does not already exist.
   *
   * @returns the updated number of points
   */
  @requireDb
  async award (name: string, points: number): Promise<number> {
    await this.db!.exec('BEGIN')

    const sqlInsert = 'INSERT OR IGNORE INTO karma (name) VALUES (?1)'
    await this.db!.run(sqlInsert, name)

    const sqlUpdate = (points >= 0)
      ? 'UPDATE karma SET increased = increased+?2 WHERE name = ?1'
      : 'UPDATE karma SET decreased = decreased+?2 WHERE name = ?1'
    await this.db!.run(sqlUpdate, name, Math.abs(points))

    const sqlSelect = 'SELECT points FROM view WHERE name = ?1'
    const result = await this.db!.get(sqlSelect, name)

    await this.db!.exec('END')

    return result.points
  }

  @requireDb
  async top (limit: number = 5): Promise<any[]> {
    const sql = 'SELECT * FROM view ORDER BY points DESC LIMIT ? '
    const results = await this.db!.all(sql, limit)
    return results.map((columns, index) => {
      return { index, ...columns }
    })
  }

  toString (): string {
    return `[KarmaPlugin ${this.databasePath}]`
  }

  /**
   * Responds to `message#` from the client.
   */
  protected async handleMessage (context: Context, text: string): Promise<void> {
    const result = KarmaPlugin.matchAward.exec(text)
    if (result === null) return

    const term = result[1]
    const dir = (result[2][0] === '-') ? -1 : +1
    let points = dir

    if (result[3] != null && result[3] !== '') {
      points *= Number.parseInt(result[3])
    } else {
      points *= Math.min(1, result[2].length - 1)
    }

    await this.handleAward(context, term, points)
  }

  protected async handleAward (context: Context, name: string, points: number): Promise<void> {
    const value = await this.award(name, points)
    this.handleUpdate(context, name, value)
  }

  /**
   * Outputs karma for a name.
   */
  protected handleUpdate (context: Context, term: string, karma: number): void {
    const response = `${context.nick}: karma for ${term} is now ${karma}.`
    this.bot.say(context.to, response)
  }

  /**
   * Outputs for a name without karma.
   */
  protected handleMissing (context: Context, term: string): void {
    const response = `${context.nick}: There is no karma for ${term}.`
    this.bot.say(context.to, response)
  }

  protected async handleGet (context: Context, term: string): Promise<void> {
    const result = await this.get(term)
    const { nick, to } = context

    const karma = (result != null) ? result.points : null

    if (karma != null) {
      this.handleUpdate(context, term, karma)
    } else {
      this.handleMissing(context, term)
    }
  }

  protected async handleSet (context: Context, term: string, value: number): Promise<boolean> {
    if (!hasAdmin(this.bot.userDb, context)) {
      return false
    }

    const result = await this.set(term, value)
    this.handleUpdate(context, term, value)
    return true
  }

  /**
   * Install hooks on the bot.
   *
   * @listens message#
   * @listens command
   */
  private installHooks (): void {
    this.bot.on('message#', (nick, to, text, message) => {
      const context = new Context()
      context.nick = nick
      context.user = message.user
      context.host = message.host
      context.to = to
      return this.handleMessage(context, text)
    })

    this.bot.on('command', async (context: Context, command: string, ...args: string[]) => {
      if (command.toLowerCase() !== 'karma') return

      // TODO: handle quoted args here as term
      const term = args.shift()

      if (term == null) {
        // TODO: print usage or help
        return
      }

      if (term.toLowerCase() === 'set') {
        if (args.length === 0 || isNaN(Number(args[0]))) {
          // TODO: print usage or help
          return
        }

        const value = Number(args.shift())
        if (isNaN(value) || value === null) {
          // TODO: print usage
          return
        }

        await this.handleSet(context, term, value)
      } else {
        await this.handleGet(context, term)
      }
    })
  }

  private async loadDatabase (): Promise<void> {
    const sql = `
      PRAGMA busy_timeout = 0;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS karma (
        id        INTEGER PRIMARY KEY,
        name      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        user      INTEGER REFERENCES user(id) ON DELETE SET NULL,
        increased INTEGER NOT NULL DEFAULT 0 CHECK (increased >= 0),
        decreased INTEGER NOT NULL DEFAULT 0 CHECK (decreased >= 0)
      );

      CREATE TABLE IF NOT EXISTS user (
        id        INTEGER PRIMARY KEY,
        username  TEXT    NOT NULL UNIQUE,
        nickname  TEXT,
        hostname  TEXT,
        timestamp TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS karma_name
        ON karma(name);

      CREATE UNIQUE INDEX IF NOT EXISTS karma_user
        ON karma(user)
        WHERE user IS NOT NULL;

      CREATE VIEW IF NOT EXISTS view AS
        SELECT *, increased-decreased AS points
        FROM karma
          LEFT OUTER JOIN user
          ON karma.user = user.id;
    `

    if (this.config instanceof FileConfig) {
      await this.config.ensureDir()
    }
    this.db = await Database.open(this.databasePath)
    await this.db.exec(sql)
  }
}
