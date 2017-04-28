const EventEmitter = require('events')
const irc = require('irc')

const getPlugins = require('./plugins')

class PurpleBot extends EventEmitter {
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

    this.plugins = getPlugins()
    for (const plugin of this.plugins) {
      try {
        plugin(this)
      } catch (error) {
        console.error(error)
      }
    }

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
            this.emit('command', nick, command, ...args)
          }
        }
      }
    })

    this._setupCommandHooks()
    this._setupOutputHooks()
  }

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

  _setupOutputHooks () {
    this.forwardClientEvent('error')

    this.forwardClientEvent('action')
    this.forwardClientEvent('invite')
    this.forwardClientEvent('join')
    this.forwardClientEvent('kill')
    this.forwardClientEvent('message')
    this.forwardClientEvent('message#')
    this.forwardClientEvent('+mode')
    this.forwardClientEvent('-mode')
    this.forwardClientEvent('motd')
    this.forwardClientEvent('names')
    this.forwardClientEvent('notice')
    this.forwardClientEvent('part')
    this.forwardClientEvent('pm')
    this.forwardClientEvent('quit')
    this.forwardClientEvent('registered', 'register')
    this.forwardClientEvent('selfMessage', 'self')
    this.forwardClientEvent('topic')
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
   * @param {function(): void} callback
   *
   * @memberOf PurpleBot
   */
  connect (callback) {
    this.client.connect(() => {
      this.emit('connect', this.server)
      if (callback != null) {
        callback()
      }
    })
  }

  /**
   * Disconnect from the IRC server.
   *
   * @param {string=} message
   *
   * @memberOf PurpleBot
   */
  disconnect (message, callback) {
    this.client.disconnect(message, () => {
      this.emit('disconnect', this.server, message)
      if (callback != null) {
        callback()
      }
    })
  }

  /**
   * Joins the bot to an IRC channel.
   *
   * @param {string} channel
   * @param {function(): void} callback
   *
   * @memberOf PurpleBot
   */
  join (channel, callback) {
    this.client.join(channel, callback)
  }

  /**
   * Parts the bot from an IRC channel.
   *
   * @param {string} channel
   * @param {string=} message
   * @param {function(): void} callback
   *
   * @memberOf PurpleBot
   */
  part (channel, message, callback) {
    this.client.part(channel, message, () => {
      this.nicks.delete(channel)
      if (callback != null) {
        callback()
      }
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
   * @readonly {string}
   *
   * @memberOf PurpleBot
   */
  get nick () {
    return this.client.nick
  }

  /**
   * Updated channel info from the client.
   *
   * @readonly {any}
   *
   * @memberOf PurpleBot
   */
  get chans () {
    return this.client.chans
  }
}

module.exports = PurpleBot
