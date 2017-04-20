const fs = require('fs')
const path = require('path')

/**
 * Asynchronously fetch available plugins.
 *
 * @param {function(Array<any>): void} callback that accepts a list of plugin modules
 */
function getPlugins (callback) {
  const pluginsDir = 'plugins'
  const plugins = []

  fs.readdir(pluginsDir, (err, files) => {
    if (err) {
      throw err
    }

    for (const file of files) {
      try {
        const requirePath = `${path.join('../', pluginsDir, file)}`
        const plugin = require(requirePath)
        if (plugin instanceof Function) {
          plugins.push(plugin)
        }
      } catch (error) {
        console.error(error)
      }
    }

    callback(plugins)
  })
}

module.exports = getPlugins
