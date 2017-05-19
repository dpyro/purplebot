/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import * as fs from 'fs-extra'
import * as path from 'path'
import * as _ from 'lodash'

import Config, { FileConfig } from './config'
import PurpleBot from './bot'

/**
 * Plugin API.
 */
export interface Plugin {
  /**
   * Plugin name used for identification and configuration.
   */
  readonly name: string

  /**
   * Asynchronously load the resources for this plugin.
   */
  load? (bot: PurpleBot, config: Config): Promise<void>

  /**
   * Reset the plugin's data.
   */
  reset? (): Promise<void>
}

async function readDir (dirPath): Promise<string[]> {
  return fs.readdir(dirPath)
}

/**
 * Fetch available plugins.
 */
export default async function loadAll (bot: PurpleBot, config: Config): Promise<Plugin[]> {
  const builtinDirPath = path.join(__dirname, '..', 'plugins')
  const plugins = await loadDirectory(builtinDirPath, bot, config)

  const userPluginDirPath = FileConfig.userPluginDirPath
  if (await fs.pathExists(userPluginDirPath)) {
    const userPlugins = await loadDirectory(userPluginDirPath, bot, config)
    plugins.push(...userPlugins)
  }

  return plugins
}

/**
 * Fetch available plugins.
 */
export async function loadDirectory (dirPath: string,
                                     bot: PurpleBot,
                                     config: Config): Promise<Plugin[]> {
  const files = await readDir(dirPath)
  const filePaths = files.map(file => path.join(__dirname, '..', 'plugins', file))

  const plugins = new Array<Plugin>()
  for (const pluginFile of filePaths) {
    const relativePath = path.relative(__dirname, pluginFile)
    try {
      const plugin = await loadFile(pluginFile, bot, config)
      if (plugin != null) {
        plugins.push(plugin)
      }
    } catch (err) {
      console.error(`Warning: could not load plugin ${relativePath}`)
      console.error(err)
    }
  }

  return plugins
}

/**
 * Load a plugin from a file.
 *
 * @throws Error
 */
export async function loadFile (pluginFile: string,
                                bot: PurpleBot,
                                config: Config): Promise<Plugin> {
  const mod: any = require(pluginFile)
  let Klass
  // TODO: verify that this actually works with JS, module.exports = Plugin
  if (typeof mod === 'object' && typeof mod.default === 'function') {
    Klass = mod.default
  } else if (typeof mod === 'function') {
    Klass = mod
  } else {
    throw new Error(`Cannot load ${pluginFile}: not a class nor default export.`)
  }

  if (typeof Klass.name === 'string') {
    const name = Klass.name
    const disabled = await config.get(`${name}:enabled`)
    if (disabled != null && !!disabled === false) {
      throw new Error(`Did not load ${pluginFile}: disabled by Config.`)
    }
    await config.set(`${name}:enabled`, true)
  }

  const plugin = new Klass()
  if (typeof plugin.load === 'function') {
    await plugin.load(bot, config)
  }

  return plugin
}
