const fs = require('fs')
const path = require('path')

/**
 * Asynchronously fetch available plugins.
 *
 * @param {function(Array<any>): void} callback that accepts a list of plugin modules
 * @returns {Array<any>} valid plugins
 */
function getPlugins () {
  const pluginsDir = 'plugins'
  const plugins = []

  const files = fs.readdirSync(pluginsDir)
  for (const file of files) {
    try {
      const requirePath = `${path.join('../', pluginsDir, file)}`
      const plugin = require(requirePath)
      if (plugin != null && plugin instanceof Function) {
        plugins.push(plugin)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return plugins
}

module.exports = getPlugins
