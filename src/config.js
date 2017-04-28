const fs = require('fs-extra')
const os = require('os')
const path = require('path')

// TODO: intercept SIGHUP
// TODO: symbolize '.purplebot'
class Config {
  /**
   * Returns a path rooted in the local config directory.
   *
   * @static
   * @param {...string} args
   * @returns
   *
   * @memberOf Config
   */
  static path (...args) {
    return path.join(os.homedir(), '.purplebot', ...args)
  }

  /**
   * Creates an instance of Config.
   * @param {string=} name
   *
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
   *
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
   *
   * @memberOf Config
   */
  set (key, value) {
    this.json[key] = value
  }
}

module.exports = Config
