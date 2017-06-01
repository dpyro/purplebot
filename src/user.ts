import { Context } from './bot'
import Config, { FileConfig } from './config'
import Database from './sqlite'

const privileges = ['~', '&', '@', '%', '+', '']

/**
 * Create a duplicate object prefixed with '@' for use as named sql bind params.
 */
function sqlify (obj: object): object {
  const result = {}
  for (const key in obj) {
    result[`@${key}`] = obj[key]
  }
  return result
}

function getId (obj: any): number {
  if (typeof obj === 'number') {
    return obj
  } else if (obj.id != null) {
    return obj.id
  } else {
    throw new Error('field id is not defined')
  }
}

export async function hasAdmin (userDb: UserDatabase, context: Context): Promise<boolean> {
  const nickname = context.nick
  const username = context.user
  const hostname = context.host

  const users = await userDb.matchUsersHostmask(nickname, username, hostname)
  if (users.length !== 1) {
    return false
  }
  const user = users[0]

  return user.admin
}

// TODO: export decorator-based validation of user permissions

export class UserDatabase {
  config: Config
  databasePath: string
  db: Database

  async load (config: Config): Promise<void> {
    this.config = config

    const sql = `
      PRAGMA auto_vacuum = FULL;
      PRAGMA busy_timeout = 0;
      PRAGMA foreign_keys = ON;
      PRAGMA user_version = 1;

      CREATE TABLE IF NOT EXISTS user (
        user_id     INTEGER   PRIMARY KEY NOT NULL,
        name        TEXT      UNIQUE,
        admin       BOOLEAN   NOT NULL CHECK (admin in (0,1)) DEFAULT 0,
        lastseen    DATETIME
      );

      CREATE TABLE IF NOT EXISTS hostmask (
        hostmask_id INTEGER   PRIMARY KEY NOT NULL,
        user_id     INTEGER   NOT NULL REFERENCES user(user_id)
          ON UPDATE CASCADE
          ON DELETE CASCADE,
        nickname    TEXT      NOT NULL UNIQUE DEFAULT "*",
        username    TEXT      NOT NULL UNIQUE DEFAULT "*",
        hostname    TEXT      NOT NULL UNIQUE DEFAULT "*",
        timestamp   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE VIEW IF NOT EXISTS view AS
        SELECT * FROM user
        LEFT NATURAL JOIN hostmask;
    `

    if (this.config instanceof FileConfig) {
      await this.config.ensureDir()
      this.databasePath = this.config.path('user.db')
      this.db = await Database.open(this.databasePath)
    } else {
      this.db = await Database.open(':memory:')
    }
    await this.db.exec(sql)
  }

  async getHostmask (id: number): Promise<Hostmask | null> {
    const sql = `
      SELECT * FROM view
      WHERE hostmask_id = ?
    `
    // TODO: consider using this.db.run
    const result = await this.db.get(sql, id)
    if (result == null) return null

    const userId = result['user_id']
    const hostmask = new Hostmask(userId)
    hostmask.id = result['hostmask_id']
    hostmask.nickname = result['nickname']
    hostmask.username = result['username']
    hostmask.hostname = result['hostname']
    hostmask.timestamp = result['timestamp']

    return hostmask
  }

  async getUser (id: number): Promise<User | null> {
    const sql = `
      SELECT * FROM view
      WHERE user_id = ?
    `
    // TODO: consider using this.db.run
    const result = await this.db.get(sql, id)
    if (result == null) return null

    const user = new User()
    user.id = result['user_id']
    user.name = result['name']
    // tslint:disable-next-line triple-equals
    user.admin = result['admin'] == true
    user.lastSeen = result['lastseen']

    return user
  }

  /**
   * Glob-based matching.
   */
  async matchUsersHostmask (nickname: string = '*', username: string = '*', hostname: string = '*'): Promise<User[]> {
    const sql = `
      SELECT * FROM view
      WHERE (nickname GLOB ?) AND (username GLOB ?) AND (hostname GLOB ?)
      GROUP BY user_id
    `
    const results = new Array<User>()

    // TODO: consider using this.db.run
    const rows = await this.db.all(sql, [nickname, username, hostname])
    for (const row of rows) {
      const user = new User()
      user.id = row['user_id']
      user.name = row['name']
      // tslint:disable-next-line triple-equals
      user.admin = row['admin'] == true
      user.lastSeen = row['lastseen']
      results.push(user)
    }

    return results
  }

  async setUser (user: User): Promise<number> {
    const sql = `
      INSERT OR REPLACE INTO user
      VALUES (@id, @name, @admin, @lastSeen)
    `
    const result = await this.db.run(sql, sqlify(user))
    const lastId = result.lastID
    user.id = lastId
    return lastId
  }

  async setHostmask (hostmask: Hostmask): Promise<number> {
    const sql = `
      INSERT OR REPLACE INTO hostmask
      VALUES (@id, @userId, @nickname, @username, @hostname, @timestamp)
    `
    const result = await this.db.run(sql, sqlify(hostmask))
    const lastId = result.lastID
    hostmask.id = lastId
    return lastId
  }

  async deleteUser (user: User | number): Promise<void> {
    const id = getId(user)
    const sql = 'DELETE FROM user WHERE user_id = ?'
    if (typeof user !== 'number') {
      user.id = undefined
    }
    return this.db.run(sql, id)
  }

  async deleteHostmask (hostmask: Hostmask | number): Promise<void> {
    const id = getId(hostmask)
    const sql = 'DELETE FROM hostmask WHERE hostmask_id = ?'
    if (typeof hostmask !== 'number') {
      hostmask.id = undefined
    }
    return this.db.run(sql, id)
  }
}

export class User {
  id?: number
  name?: string
  admin: boolean
  lastSeen?: Date
}

export class ChannelUser extends User {
  mode?: string

  hasPermissionLevel (mode: string): boolean {
    if (this.mode == null) return false

    const testIndex = this.mode.indexOf(mode)
    if (testIndex === -1) return false

    const index = privileges.indexOf(mode)
    if (index === -1) return false

    return index <= testIndex
  }
}

export class Hostmask {
  id?: number
  userId: number
  nickname?: string
  username?: string
  hostname?: string
  timestamp?: Date

  constructor (user: User | number) {
    this.userId = getId(user)
  }

  toString (): string {
    const nick = (this.nickname != null) ? this.nickname : '*'
    const user = (this.username != null) ? this.username : '*'
    const host = (this.hostname != null) ? this.hostname : '*'

    return `${nick}!${user}@${host}`
  }
}
