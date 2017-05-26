import * as fs from 'fs-extra'
import * as nconf from 'nconf'
import * as os from 'os'
import * as path from 'path'
import * as yargs from 'yargs'

export default abstract class Config {
  nconf: nconf.Provider

  protected constructor () {
    this.nconf = new nconf.Provider({})
  }

  /**
   * Asynchronously delete all the keys.
   */
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

  /**
   * Asynchronously retrieve the value for a given `key`.
   */
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

  /**
   * Asynchronously store `value` for a given `key`.
   */
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

  abstract toString (): string
}

export class MemConfig extends Config {
  constructor () {
    super()

    this.nconf.use('memory')
  }

  toString (): string {
    return `[MemConfig]`
  }
}

/**
 * Configuration and data from disk.
 */
export class FileConfig extends Config {
  static configFileName = 'config.json'
  configDirPath: string

  /**
   * Create an instance of Config.
   */
  protected constructor (configDirPath: string) {
    super()

    this.configDirPath = configDirPath
  }

  static get userDirPath (): string {
    return path.join(os.homedir(), '.purplebot')
  }

  static get userPluginDirPath (): string {
    return path.join(FileConfig.userDirPath, 'plugins')
  }

  /**
   * Creates a `Config` from the a given path to a configuration,
   * or from the user directory if none is given.
   */
  static standard (configDirPath?: string): FileConfig {
    if (configDirPath != null) {
      const config = new FileConfig(configDirPath)
      config.nconf
        .env()
        .file('file', config.configFilePath)
      return config
    }

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

    const config = new FileConfig(FileConfig.userDirPath)
    config.nconf
      .argv(yargsOptions)
      .env()
      .file('file', config.configFilePath)
    return config
  }

  /**
   * Creates a temporary config directory.
   */
  static async temp (): Promise<FileConfig> {
    const prefix = path.join(os.tmpdir(), 'purplebot-')
    const configDir = fs.mkdtempSync(prefix)
    const config = new FileConfig(configDir)
    config.nconf
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
   * Returns a path rooted in the config directory.
   */
  path (...args: string[]): string {
    return path.join(this.configDirPath, ...args)
  }

  /**
   * Returns the path to the config file itself.
   */
  get configFilePath (): string {
    return path.join(this.configDirPath, 'config.json')
  }

  /**
   * Load the configuration from disk.
   */
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

  /**
   * Store the current configuration to disk.
   */
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

  toString () {
    return `[FileConfig ${this.configFilePath}]`
  }
}
