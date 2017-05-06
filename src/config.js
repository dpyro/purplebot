/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'

/**
 * Manages configuration and data paths.
 *
 * @memberof module:purplebot
 */
class Config {
  /**
   * Creates a temporary config directory.
   *
   * @returns {Promise<Config>}
   *
   * @static
   * @memberof Config
   */
  static async temp () {
    const tempPrefix = path.join(os.tmpdir(), 'purplebot-')
    return new Promise((resolve, reject) => {
      fs.mkdtemp(tempPrefix, (err, folder) => {
        if (err != null) {
          reject(err)
        } else {
          const config = new Config(folder)
          resolve(config)
        }
      })
    })
  }

  /**
   * Creates an instance of Config.
   *
   * @param {string=} name a path
   *
   * @memberOf Config
   */
  constructor (name) {
    if (!name) {
      this.configDir = path.join(os.homedir(), '.purplebot')
    } else {
      if (path.isAbsolute(name)) {
        this.configDir = path.normalize(name)
      } else {
        this.configDir = path.join(os.homedir(), name)
      }
    }
    this.json = {}
  }

  /**
   * Determine if the config directory already exists.
   *
   * @return {Promise<boolean>}
   *
   * @memberOf Config
   */
  async hasDir () {
    return new Promise((resolve, reject) => {
      fs.access(this.configDir, fs.constants.F_OK | fs.constants.R_OK, (err) => {
        if (err != null) {
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  }

  /**
   * Creates the directory for this `Config`.
   *
   * @returns {Promise<void>}
   *
   * @memberOf Config
   */
  async ensureDir () {
    return new Promise((resolve, reject) => {
      fs.ensureDir(this.configDir, (err) => {
        if (err != null) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Deletes the config directory.
   *
   * @returns {Promise<void>}
   *
   * @memberof Config
   */
  async removeDir () {
    return new Promise((resolve, reject) => {
      fs.remove(this.configDir, (err) => {
        if (err != null) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Retrieves the path to the `config.json`.
   *
   * @readonly
   * @memberof Config
   */
  get configPath () {
    return this.path('config.json')
  }

  /**
   * Returns a path rooted in the local config directory.
   *
   * @param {...string} args
   * @returns {string}
   *
   * @memberOf Config
   */
  path (...args) {
    return path.join(this.configDir, ...args)
  }

  /**
   * Loads this configuration from disk.
   *
   * @returns {Promise<any>}
   *
   * @memberOf Config
   *
   * @todo rename to load
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
   * Saves the configuration to disk.
   *
   * @returns {Promise<void>}
   *
   * @memberOf Config
   */
  async flush () {
    return new Promise((resolve, reject) => {
      fs.writeJson(this.configPath, this.json, (err, result) => {
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
   * @param {string=} key
   * @returns {any}
   *
   * @memberOf Config
   */
  get (key) {
    return (key == null) ? this.json : this.json[key]
  }

  /**
   * Sets an associated value.
   *
   * @param {string} key
   * @param {any} value
   *
   * @memberOf Config
   */
  set (key, value) {
    this.json[key] = value
  }
}

export default Config
