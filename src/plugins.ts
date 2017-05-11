/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import * as fs from 'fs-extra'
import * as path from 'path'
import * as _ from 'lodash'

import Config from './config'
import PurpleBot from './bot'

/**
 * Plugin API.
 */
export interface Plugin {
  /**
   * Asynchronously loads the resources for this plugin.
   */
  load? (bot: PurpleBot, config: Config): Promise<boolean>

  /**
   * Resets the data.
   */
  reset? (): Promise<void>
}

async function readdir (dirPath): Promise<string[]> {
  return fs.readdir(dirPath)
}

/**
 * Synchronously fetch the available plugins.
 */
export default async function loadPlugins (bot: PurpleBot, config: Config): Promise<Plugin[]> {
  const dirname = path.join(__dirname, '..', 'plugins')
  const files = await readdir(dirname)
  const filePaths = files.map(file => path.join(__dirname, '..', 'plugins', file))

  const plugins = []
  for (const pluginFile of filePaths) {
    const relativePath = path.relative(__dirname, pluginFile)
    try {
      const mod = require(pluginFile)
      const Klass = (mod as any).default
      const plugin = new Klass()
      if (typeof plugin.load === 'function') {
        const result = await plugin.load(bot, config)
        if (result === false) {
          // TODO: console.error(`${relativePath} load() returned false`)
        } else {
          plugins.push(plugin)
        }
      }
    } catch (err) {
      console.error(`Warning: could not load plugin ${relativePath}`)
      console.error(err.stack)
    }
  }

  return plugins
}
