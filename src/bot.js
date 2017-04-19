const EventEmitter = require('events')
const irc = require('irc')

const logging = require('./logging')

class PurpleBot extends EventEmitter {
  constructor (options) {
    super()

    options = options || {}
    const nick = options.nick || 'PurpleBot'

    this.server = options.server || 'localhost'
    const clientOptions = {
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
    this.nicks = new Map()

    logging(this.client, `${this.server}.log`)

    this.client.on('names', (channel, nicks) => {
      this.nicks.set(channel, nicks)
    })

    this.setupCommandHooks()
    this.setupOutputHooks()
  }

  setupCommandHooks () {
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

  setupOutputHooks () {
    this.forwardClientEvent('error')
    this.forwardClientEvent('join')
    this.forwardClientEvent('part')
  }

  /**
   * Enable an event forward from `this.client` -> `this`.
   *
   * @param {any} from event name to listen for in client
   * @param {any} [to=from] name for forwarding the client event
   *
   * @memberOf PurpleBot
   */
  forwardClientEvent (from, to = from) {
    this.client.on(from, (...args) => {
      this.emit(to, ...args)
    })
  }

  /**
   * Connect to the IRC server.
   *
   * @param {number=} retryCount
   *
   * @memberOf PurpleBot
   */
  connect (retryCount) {
    this.client.connect(retryCount, () => {
      this.emit('connected')
    })
  }

  /**
   * Disconnect from the IRC server.
   *
   * @param {string=} message
   *
   * @memberOf PurpleBot
   */
  disconnect (message) {
    this.client.disconnect(message, () => {
      this.emit('disconnected')
    })
  }

  /**
   * Joins the bot to an IRC channel.
   *
   * @param {string} channel
   *
   * @memberOf PurpleBot
   */
  join (channel) {
    this.client.join(channel)
  }

  /**
   * Parts the bot from an IRC channel.
   *
   * @param {string} channel
   * @param {string=} message
   *
   * @memberOf PurpleBot
   */
  part (channel, message) {
    this.client.part(channel, message, () => {
      this.nicks.delete(channel)
    })
  }

  /**
   * Sends a message to the target.
   *
   * @param {string} target
   * @param {string} message
   *
   * @memberOf PurpleBot
   */
  say (target, message) {
    this.client.say(target, message)
  }
}

module.exports = PurpleBot
