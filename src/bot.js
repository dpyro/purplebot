/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import 'babel-polyfill'
import EventEmitter from 'events'
import irc from 'irc'

import loadPlugins from './plugins'

/**
 * Node.js asynchronous core.
 *
 * @external EventEmitter
 * @see {@link https://nodejs.org/api/events.html Node.js Events API}
 */

/**
 * A library to provide IRC functionality.
 *
 * @external irc
 * @see {@link https://github.com/martynsmith/node-irc node-irc}
 */

/**
 * Configurable bot that wraps `node-irc`.
 *
 * @extends external:EventEmitter
 * @property {string} server
 * @property {external:irc.Client} client
 * @property {Map<string, function(...any): void>} commands
 * @property {Array<any>} plugins
 */
class PurpleBot extends EventEmitter {
  /**
   * Creates an instance of PurpleBot.
   *
   * @param {{nick: string, server: string, channels: Array<string>, debug: boolean}} options
   * @memberOf PurpleBot
   */
  constructor (options) {
    super()

    options = options || {}
    const nick = options.nick || 'PurpleBot'

    this.server = options.server || 'localhost'
    const clientOptions = {
      socket: options.socket || false,
      userName: nick,
      realName: nick,
      channels: options.channels || [],
      showErrors: options.debug || false,
      autoConnect: false,
      autoRejoin: true,
      floodProtection: true,
      debug: options.debug || false
    }
    this.client = new irc.Client(
      this.server,
      nick,
      clientOptions
    )

    this.client.on('message', (nick, to, text, message) => {
      const trimmedText = text.trim()
      if (trimmedText.startsWith('.') && trimmedText.substring(1, 2) !== '.') {
        // TODO: accept quoted arguments
        const words = trimmedText.split(' ')
        const filteredWords = words.filter((element, index, arr) => {
          return element != null && element !== ''
        })

        if (filteredWords.length >= 1) {
          const command = filteredWords.shift().substring(1)
          if (command !== '') {
            const args = filteredWords
            const context = { nick, to, text, message }
            this.emit('command', context, command, ...args)
          }
        }
      }
    })

    this._setupCommandHooks()
    this._installForwards()
  }

  async loadPlugins () {
    this.plugins = await loadPlugins(this)
  }

  /**
   * Creates and populates `this.commands`.
   *
   * @memberOf PurpleBot
   * @private
   */
  _setupCommandHooks () {
    this.commands = new Map()

    this.commands.set('connect', this.connect.bind(this))
    this.commands.set('disconnect', this.disconnect.bind(this))
    this.commands.set('join', (...args) => {
      if (args == null || args.length < 1) {
        return false
      }

      const channel = args.shift()
      this.join(channel)
    })
    this.commands.set('part', (...args) => {
      if (args == null || args.length < 1) {
        return false
      }

      const channel = args.shift()
      const message = args.shift()
      this.part(channel, message)
    })
    this.commands.set('say', (...args) => {
      if (args == null || args.length < 2) {
        return false
      }

      const target = args.shift()
      const message = args.shift()
      this.say(target, message)
    })
  }

  /**
   * Applies event forwarding.
   *
   * @memberOf PurpleBot
   * @private
   */
  _installForwards () {
    this.forwardClientEvent('error')

    this.forwardClientEvent('action')
    this.forwardClientEvent('invite')
    this.forwardClientEvent('kill')
    this.forwardClientEvent('message')
    this.forwardClientEvent('message#')
    this.forwardClientEvent('+mode')
    this.forwardClientEvent('-mode')
    this.forwardClientEvent('motd')
    this.forwardClientEvent('names')
    this.forwardClientEvent('notice')
    this.forwardClientEvent('pm')
    this.forwardClientEvent('quit')
    this.forwardClientEvent('registered', 'register')
    this.forwardClientEvent('selfMessage', 'self')
    this.forwardClientEvent('topic')
  }

  /**
   * Enable an event forward from `this.client` -> `this`.
   *
   * @param {string} from event name to listen for in client
   * @param {string} [to=from] name for forwarding the client event
   * @memberOf PurpleBot
   * @private
   */
  forwardClientEvent (from, to = from) {
    this.client.on(from, (...args) => {
      this.emit(to, ...args)
    })
  }

  /**
   * Connect to the IRC server.
   *
   * @fires PurpleBot#connect
   * @memberOf PurpleBot
   */
  async connect () {
    return new Promise((resolve, reject) => {
      this.client.connect(() => {
        this.emit('connect', this.server)
        return resolve.call(this, this.server)
      })
    })
  }

  /**
   * Disconnect from the IRC server.
   *
   * @param {string=} message
   * @fires PurpleBot#disconnect
   * @memberOf PurpleBot
   */
  async disconnect (message) {
    return new Promise((resolve, reject) => {
      this.client.disconnect(message, () => {
        this.emit('disconnect', this.server, message)
        return resolve.call(this, this.server, message)
      })
    })
  }

  /**
   * Joins the bot to an IRC channel.
   *
   * @param {string} channel
   * @fires PurpleBot#join
   * @memberOf PurpleBot
   */
  async join (channel) {
    return new Promise((resolve, reject) => {
      this.client.join(channel, () => {
        this.emit('join', channel)
        return resolve.call(this, channel)
      })
    })
  }

  /**
   * Parts the bot from an IRC channel.
   *
   * @param {string} channel
   * @param {string=} message
   * @fires PurpleBot#part
   * @memberOf PurpleBot
   */
  async part (channel, message) {
    return new Promise((resolve, reject) => {
      this.client.part(channel, message, () => {
        this.emit('part', channel, message)
        resolve.call(this, channel)
      })
    })
  }

  /**
   * Sends a message to the target.
   *
   * @param {string} target
   * @param {string} message
   * @fires PurpleBot#say
   * @memberOf PurpleBot
   */
  say (target, message) {
    this.client.say(target, message)
  }

  /**
   * String representation
   *
   * @returns {string}
   *
   * @memberOf PurpleBot
   */
  toString () {
    return `[PurpleBot: ${this.server}]`
  }

  /**
   * Current nick of the bot.
   *
   * @readonly
   * @memberOf PurpleBot
   */
  get nick () {
    return this.client.nick
  }

  /**
   * Updated channel info from the client.
   *
   * @readonly
   * @memberOf PurpleBot
   */
  get chans () {
    return this.client.chans
  }
}

async function init (options) {
  const bot = new PurpleBot(options)
  await bot.loadPlugins()
  return bot
}

// Exports are named at the end to work around a JSDoc3 bug.
// See: https://github.com/jsdoc3/jsdoc/issues/1137.
export default init
export { PurpleBot }
