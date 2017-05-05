/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import { join } from 'path'
import requireAll from 'require-all'
import _ from 'lodash'

/**
 * @interface Plugin
 */

/**
 * Creates an instance of the plugin.
 *
 * @constructor
 * @param {PurpleBot} bot
 * @param {?Config} config
 * @memberof Plugin
 */

/**
 * Asynchronously loads the resources for this plugin.
 *
 * @function load
 * @returns {Promise}
 *
 * @memberof Plugin
 * @instance
 */

/**
 * Synchronously fetch the available plugins.
 *
 * @param {PurpleBot} bot loads available plugins
 * @returns {Array<Plugin>} loaded plugins
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
