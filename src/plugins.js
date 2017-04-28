/**
 * @module PurpleBot
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

const fs = require('fs')
const path = require('path')

/**
 * Synchronously fetch the available plugins.
 *
 * @param {PurpleBot} bot loads plugin with this parameter
 * @returns {Array} loaded plugins
 */
function getPlugins (bot) {
  const pluginsDir = 'plugins'
  const plugins = []

  const files = fs.readdirSync(pluginsDir)
  for (const file of files) {
    try {
      const requirePath = `${path.join('../', pluginsDir, file)}`
      const plugin = require(requirePath)
      let result
      try {
        result = plugin(bot)
      } catch (error) {
        result = file
      }
      plugins.push(result)
    } catch (error) {
      console.error(error)
    }
  }

  return plugins
}

module.exports = getPlugins
