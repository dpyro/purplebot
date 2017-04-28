const fs = require('fs-extra')
const os = require('os')
const path = require('path')

// TODO: intercept SIGHUP
// TODO: symbolize '.purplebot'
class Config {
  static path (...args) {
    return path.join(os.homedir(), '.purplebot', ...args)
  }

  /**
   * Creates an instance of Config.
   * @param {string?} name
   *
   * @memberOf Config
   */
  constructor (name) {
    this.configPath = (!name) ? path.join(Config.dir, name) : name
    this.sync()
  }

  sync () {
    this.json = fs.readJSONSync(this.configPath, this.json, {spaces: 2})
  }

  flush () {
    fs.writeJSONSync(this.configPath, this.json)
  }

  get (key) {
    return this.json[key]
  }

  set (key, value) {
    this.json[key] = value
  }
}

module.exports = Config
