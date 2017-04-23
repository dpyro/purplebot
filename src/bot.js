const EventEmitter = require('events')
const fs = require('fs')
const irc = require('irc')
const path = require('path')

const getPlugins = require('./plugins')

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

    this.plugins = getPlugins((plugins) => {
      for (const plugin of plugins) {
        try {
          plugin(this)
        } catch (error) {
          console.error(error)
        }
      }
    })

    this.client.on('names', (channel, nicks) => {
      this.nicks.set(channel, nicks)
    })
    this.client.on('nick', (oldnick, newnick, channels, message) => {
      for (const channel of channels) {
        const channelNicks = this.nicks && this.nicks.get(channel)
        if (channelNicks != null) {
          let mode = channelNicks.get(oldnick) || ''
          channelNicks.delete(oldnick)
          channelNicks.set(newnick, mode)
        }
      }
    })

    this.setupPlugins()
    this.setupCommandHooks()
    this.setupOutputHooks()
  }

  setupPlugins () {
    const pluginsDir = 'plugins'

    fs.readdir(pluginsDir, (err, files) => {
      if (err) {
        throw err
      }

      for (const file of files) {
        try {
          const requirePath = `${path.join('../', pluginsDir, file)}`
          const plugin = require(requirePath)
          plugin(this)
        } catch (error) {
          console.error(error)
        }
      }
    })
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
  disconnect (message) {
    this.client.disconnect(message, () => {
      this.emit('disconnect', this.server, message)
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
