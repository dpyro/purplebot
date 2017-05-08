/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import * as fs from 'fs'
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
  load (bot: PurpleBot, config?: Config): Promise<void>
}

async function readdir (path): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err != null) {
        reject(err)
      } else {
        resolve(files)
      }
    })
  })
}

/**
 * Synchronously fetch the available plugins.
 */
export default async function loadPlugins (bot: PurpleBot, config?: Config): Promise<Plugin[]> {
  const dirname = path.join(__dirname, '..', 'plugins')
  const files = await readdir(dirname)
  const filePaths = files.map(file => path.join(__dirname, '..', 'plugins', file))

  const plugins = []
  for (const pluginFile of filePaths) {
    try {
      const mod = require(pluginFile)
      const Klass = (mod as any).default
      const plugin = new Klass()
      await plugin.load(bot, config)
    } catch (err) {
      console.error(`Warning: could not load plugin ${pluginFile}`)
      console.error(err.stack)
    }
  }

  return plugins
}
