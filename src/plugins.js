/**
 * @module PurpleBot
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import { join } from 'path'
import requireAll from 'require-all'

/**
 * Synchronously fetch the available plugins.
 *
 * @param {PurpleBot} bot loads plugin with this parameter
 * @returns {Array} loaded plugins
 */
export default function getPlugins (bot) {
  return requireAll({
    dirname: join(__dirname, '..', 'plugins'),
    resolve: (plugin) => {
      const P = plugin.default
      return new P(bot)
    }
  })
}
