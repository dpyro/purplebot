/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import fs from 'fs-extra'
import os from 'os'
import path from 'path'

/**
 * Manages configuration and data paths.
 */
class Config {
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
  }

  /**
   * Saves this configuration.
   *
   * @memberOf Config
   */
  async sync () {
    return new Promise((resolve, reject) => {
      fs.readJson(this.configPath, (err, result) => {
        if (err) {
          reject(err)
        } else {
          this.json = result
          resolve(result)
        }
      })
    })
  }

  /**
   * Loads the configuration from disk.
   *
   * @memberOf Config
   */
  async flush () {
    return new Promise((resolve, reject) => {
      fs.writeJson(this.configPath, this.json, {spaces: 2}, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
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
}

export default Config
