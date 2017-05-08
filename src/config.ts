/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'

/**
 * Manages configuration and data paths.
 */
export default class Config {
  configDir: string
  json: Object

  /**
   * Creates an instance of Config.
   */
  constructor (name?: string) {
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
   * Creates a temporary config directory.
   */
  static async temp (): Promise<Config> {
    const tempPrefix = path.join(os.tmpdir(), 'purplebot-')
    return new Promise<Config>((resolve, reject) => {
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
   * Determine if the config directory already exists.
   */
  async hasDir (): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
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
   */
  async ensureDir (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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
   */
  async removeDir (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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
   */
  get configPath (): string {
    return this.path('config.json')
  }

  /**
   * Returns a path rooted in the local config directory.
   *
   * @memberOf Config
   */
  path (...args): string {
    return path.join(this.configDir, ...args)
  }

  /**
   * Loads this configuration from disk.
   *
   * @todo rename to load
   */
  async sync (): Promise<any> {
    return new Promise<any>((resolve, reject) => {
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
   */
  async flush (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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
   */
  get (key?: string): any {
    return (key == null) ? this.json : this.json[key]
  }

  /**
   * Sets an associated value.
   */
  set (key: string, value: any): void {
    this.json[key] = value
  }
}
