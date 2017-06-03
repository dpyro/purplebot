import * as sqlite from 'sqlite3'

export default class Database {
  db: sqlite.Database

  constructor (db: sqlite.Database) {
    this.db = db
  }

  static async open (path: string): Promise<Database> {
    let db
    return new Promise<void>((resolve, reject) => {
      db = new sqlite.Database(path, err => {
        if (err !== null) {
          reject(err)
        } else {
          resolve()
        }
      })
    }).then<Database>(() => new Database(db))
  }

  async close (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.close(err => {
        if (err !== null) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async run (sql: string, ...params: any[]): Promise<sqlite.RunResult> {
    return new Promise<sqlite.RunResult>((resolve, reject) => {
      this.db.run(sql, ...params, function (this: any, err) {
        if (err !== null) {
          reject(err)
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          })
        }
      })
    })
  }

  async exec (sql: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.exec(sql, err => {
        if (err !== null) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async get (sql: string, ...params: any[]): Promise<any | undefined> {
    return new Promise<any>((resolve, reject) => {
      this.db.get(sql, ...params, (err, row) => {
        if (err !== null) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
  }

  async all (sql: string, ...params: any[]): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      this.db.all(sql, ...params, (err, rows) => {
        if (err !== null) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }
}
