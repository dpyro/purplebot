/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import { join } from 'path'
import requireAll from 'require-all'
import _ from 'lodash'

/**
 * Plugin API.
 *
 * @interface Plugin
 *
 * @memberof module:purplebot
 */

/**
 * Creates an instance of the plugin. Required.
 *
 * @constructs
 * @param {module:purplebot.PurpleBot} bot
 * @param {?module:purplebot.Config} config
 *
 * @memberof module:purplebot.Plugin
 */

/**
 * Asynchronously loads the resources for this plugin. Optional.
 *
 * @function load
 * @returns {Promise}
 *
 * @memberof module:purplebot.Plugin
 * @instance
 */

/**
 * Synchronously fetch the available plugins.
 *
 * @param {module:purplebot.PurpleBot} bot loads available plugins
 * @returns {Promise<Plugin[]>} loaded plugins
 *
 * @memberof module:purplebot
 */
async function loadPlugins (bot) {
  const plugins = requireAll({
    dirname: join(__dirname, '..', 'plugins'),
    resolve: (plugin) => {
      return plugin.default
    }
  })
  const values = _.values(plugins)
  return Promise.all(values.map(element => {
    try {
      return element(bot)
    } catch (err) {
      console.error(`Warning: could not load plugin ${element}`)
      return null
    }
  }))
}

export default loadPlugins
