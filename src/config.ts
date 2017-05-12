import * as fs from 'fs-extra'
import * as nconf from 'nconf'
import * as os from 'os'
import * as path from 'path'
import * as yargs from 'yargs'

export default class Config {
  static configFileName = 'config.json'
  configDirPath: string
  nconf: nconf.Provider

  /**
   * Creates an instance of Conf.
   */
  private constructor (configDirPath?: string) {
    this.configDirPath = configDirPath
  }

  static get userDirPath (): string {
    return path.join(os.homedir(), '.purplebot')
  }

  static automatic (): Config {
    const yargsOptions = {
      'c': {
        alias: 'channels',
        default: [],
        describe: 'channels to join upon connect',
        type: 'array'
      },
      'n': {
        alias: 'nick',
        default: 'purplebot',
        nargs: 1,
        type: 'string'
      },
      's': {
        alias: 'server',
        default: 'localhost',
        describe: 'connect to this server',
        nargs: 1,
        type: 'string'
      },
      'v': {
        alias: 'verbose',
        describe: 'Print debugging output',
        type: 'boolean'
      }
    }
    yargs.usage('Usage: $0 [-s server.address:port] [-c #channel1 #channel2 ...]')
      .help()

    const config = new Config(Config.userDirPath)
    config.nconf = new nconf.Provider({})
      .argv(yargsOptions)
      .env()
      .file('file', config.configFilePath)
    return config
  }

  static memory (): Config {
    const config = new Config(null)
    config.nconf = new nconf.Provider({})
      .use('memory')
    return config
  }

  static path (configDirPath: string): Config {
    const config = new Config(configDirPath)
    config.nconf = new nconf.Provider({})
      .env()
      .file('file', config.configFilePath)
    return config
  }

  /**
   * Creates a temporary config directory.
   */
  static async temp (): Promise<Config> {
    const prefix = path.join(os.tmpdir(), 'purplebot-')
    const configDir = fs.mkdtempSync(prefix)
    const config = new Config(configDir)
    config.nconf = new nconf.Provider({})
      .file('file', config.configFilePath)
    await config.load()
    return config
  }

  /**
   * Determine if the config directory already exists.
   */
  async hasDir (): Promise<boolean> {
    return fs.access(this.configDirPath)
      .then(() => true)
      .catch(() => false)
  }

  /**
   * Creates the directory for this `Config`.
   */
  async ensureDir (): Promise<void> {
    return fs.ensureDir(this.configDirPath)
  }

  /**
   * Deletes the config directory.
   */
  async removeDir (): Promise<void> {
    return fs.remove(this.configDirPath)
  }

  /**
   * Returns a path rooted in the local config directory, if one was specified.
   */
  path (...args: string[]): string {
    return (this.configDirPath != null) ? path.join(this.configDirPath, ...args) : null
  }

  /**
   * Returns the path to the config file itself, if a config directory was specified.
   */
  get configFilePath (): string {
    return (this.configDirPath != null) ? path.join(this.configDirPath, 'config.json') : null
  }

  async clear (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.nconf.reset((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async load (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.nconf.load(err => {
        if (err != null) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async save (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.nconf.save('file', err => {
        if (err != null) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async get (key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      (this.nconf.get as (err, result) => void)(key, (err, result) => {
        if (err != null) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  async set (key: string, value: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.nconf.set(key, value, (err) => {
        if (err != null) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  toString () {
    return `[Config ${this.configDirPath}]`
  }
}
