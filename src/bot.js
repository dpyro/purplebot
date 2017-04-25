const EventEmitter = require('events')
const irc = require('irc')

const getPlugins = require('./plugins')

class ChannelInfo {
  constructor () {
    this.nicks = new Map()
    this.topic = ''
  }
}

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
    this.channels = new Map()

    this.plugins = getPlugins()
    for (const plugin of this.plugins) {
      try {
        plugin(this)
      } catch (error) {
        console.error(error)
      }
    }

    this.client.on('join', (channel, nick, message) => {
      this.getChannelInfo(channel).set(nick, '')
    })

    this.client.on('kick', (channel, nick, by, reason, message) => {
      this.deleteNick(nick, [channel])
    })

    this.client.on('kill', (nick, reason, channels, message) => {
      this.deleteNick(nick, channels)
    })

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
          const args = filteredWords

          this.emit('command', nick, command, ...args)
        }
      }
    })

    this.client.on('+mode', (channel, by, mode, argument, message) => {
      const info = this.getChannelInfo(channel)
      if (info.nicks.has(argument)) {
        info.nicks.set(argument, mode)
      }
    })

    this.client.on('-mode', (channel, by, mode, argument, message) => {
      const info = this.getChannelInfo(channel)
      if (info.nicks.has(argument)) {
        const currentMode = info.nicks.get(argument)
        info.nicks.set(argument, mode.replace(currentMode, ''))
      }
    })

    this.client.on('names', (channel, nicks) => {
      this.getChannelInfo(channel).nicks = nicks
    })

    this.client.on('nick', (oldnick, newnick, channels, message) => {
      for (const channel of channels) {
        const info = this.getChannelInfo(channel)
        const mode = info.nicks.get(oldnick) || ''
        info.nicks.delete(oldnick)
        info.nicks.set(newnick, mode)
      }
    })

    this.client.on('part', (channel, nick, reason, message) => {
      this.deleteNick(nick, [channel])
    })

    this.client.on('quit', (nick, reason, channels, message) => {
      this.deleteNick(nick, channels)
    })

    this.client.on('topic', (channel, topic, nick, message) => {
      this.getChannelInfo(channel).topic = topic
    })

    this.setupCommandHooks()
    this.setupOutputHooks()
  }

  getChannelInfo (channel) {
    let result = this.channels.get(channel)
    if (result == null) {
      result = new ChannelInfo()
      this.channels.set(channel, result)
    }
    return result
  }

  deleteNick (nick, channels) {
    for (const channel of channels) {
      const info = this.getChannelInfo(channel)
      if (info != null) {
        info.nicks.delete(nick)
      }
    }
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
    this.client.connect(null, () => {
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
}

module.exports = PurpleBot
