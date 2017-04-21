const fs = require('fs-extra')
const os = require('os')
const path = require('path')

// TODO: fs.watchFile
// TODO: symbolize '.purplebot'
class Config {
  /**
   * Creates an instance of Config.
   * @param {string?} name
   *
   * @memberOf Config
   */
  constructor (name) {
    this.configPath = (!name) ? path.join(os.homedir(), '.purplebot', name) : name
    this.json = null
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
