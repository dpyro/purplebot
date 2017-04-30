/**
 * @module PurpleBot
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import sqlite from 'sqlite'

/**
 * Manages configuration and data paths.
 */
export default class Config {
  /**
   * Returns a path rooted in the local config directory.
   *
   * @static
   * @param {...string} args
   * @returns {string}
   * @memberOf Config
   */
  static path (...args) {
    // TODO: symbolize '.purplebot'
    return path.join(os.homedir(), '.purplebot', ...args)
  }

  /**
   * Creates an instance of Config.
   *
   * @param {string=} name
   * @memberOf Config
   */
  constructor (name) {
    this.configPath = (!name) ? path.join(Config.dir, name) : name
    this.sync()
  }

  /**
   * Synchronously saves this configuration.
   *
   * @memberOf Config
   */
  sync () {
    this.json = fs.readJSONSync(this.configPath, this.json, {spaces: 2})
  }

  /**
   * Synchronously loads the configuration from disk.
   *
   * @memberOf Config
   */
  flush () {
    fs.writeJSONSync(this.configPath, this.json)
  }

  /**
   * Returns an associated value.
   *
   * @param {string} key
   * @returns {any}
   * @memberOf Config
   */
  get (key) {
    return this.json[key]
  }

  /**
   * Sets an associated value.
   *
   * @param {string} key
   * @param {any} value
   * @memberOf Config
   */
  set (key, value) {
    this.json[key] = value
  }

  async database () {
    if (this.db != null) {
      return this.db
    }

    const dbPath = Config.path('database.db')
    return Promise.resolve()
      .then(() => sqlite.open(dbPath))
      .catch(err => console.error(err.stack))
      .then((db) => {
        this.db = db
        return db
      })
  }
}
