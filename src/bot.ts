/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import { EventEmitter } from 'events'
import * as irc from 'irc'
import * as _ from 'lodash'

import { CommandMap } from './cli'
import Config from './config'
import loadPlugins, { Plugin } from './plugins'

/**
 * A library to provide IRC functionality.
 *
 * @external irc
 * @see {@link https://github.com/martynsmith/node-irc node-irc}
 */

/**
 * Configurable bot that wraps `node-irc`.
 */
export default class PurpleBot extends EventEmitter implements CommandMap {
  client: irc.Client
  commands: {[key in string]: (...args: any[]) => void}
  config: Config
  debug: boolean
  plugins: Plugin[]
  server: string
  socket: boolean

  /**
   * Loads the config and plugins and then connects to the configured server.
   *
   * @todo parallelize the awaits
   */
  async load (config?: Config): Promise<void> {
    this.config = config || Config.memory()
    this.config.nconf.defaults({
      channels: [],
      debug: false,
      nick: 'PurpleBot',
      server: 'localhost',
      socket: false
    })

    this.debug = !!await this.config.get('debug')
    this.server = await this.config.get('server')
    this.socket = !!await this.config.get('socket')
    const nick = await this.config.get('nick')
    const channels = await this.config.get('channels')

    const clientOptions = {
      socket: this.socket,
      userName: nick,
      realName: nick,
      channels: channels,
      showErrors: this.debug,
      autoConnect: false,
      autoRejoin: true,
      floodProtection: true,
      debug: this.debug
    }
    this.client = new irc.Client(
      this.server,
      nick,
      clientOptions
    )

    this.installClientHooks()
    this.setupCommandHooks()
    this.installForwards()

    this.plugins = await loadPlugins(this, this.config)
  }

  /**
   * Connect to the IRC server.
   *
   * @fires PurpleBot#connect
   */
  async connect (): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.connect(() => {
        this.emit('connect', this.server)
        return resolve(this.server)
      })
    })
  }

  /**
   * Disconnect from the IRC server.
   *
   * @fires PurpleBot#disconnect
   */
  async disconnect (message?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.disconnect(message, () => {
        this.emit('disconnect', this.server, message)
        resolve(this.server)
      })
    })
  }

  /**
   * Joins the bot to an IRC channel.
   *
   * @returns the joined channel
   *
   * @fires PurpleBot#join
   */
  async join (channel: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.join(channel, () => {
        this.emit('join', channel)
        return resolve(channel)
      })
    })
  }

  /**
   * Parts the bot from an IRC channel.
   *
   * @returns the parted channel
   *
   * @fires PurpleBot#part
   */
  async part (channel: string, message?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.part(channel, message, () => {
        this.emit('part', channel, message)
        resolve(channel)
      })
    })
  }

  /**
   * Sends a message to the target.
   *
   * @fires PurpleBot#say
   */
  say (target: string, message: string): void {
    this.client.say(target, message)
  }

  /**
   * String representation.
   */
  toString (): string {
    return `[PurpleBot: ${this.server}]`
  }

  /**
   * Current nick of the bot.
   *
   * @readonly
   */
  get nick (): string {
    return (this.client != null) ? this.client.nick : null
  }

  /**
   * Updated channel info from the client.
   *
   * @readonly
   */
  get chans () {
    return (this.client != null) ? this.client.chans : null
  }

  /**
   * Creates and populates `this.commands`.
   */
  private setupCommandHooks (): void {
    this.commands = {
      'connect': this.connect.bind(this),
      'disconnect': this.disconnect.bind(this),
      'join': (...args) => {
        if (args == null || args.length < 1) return

        const channel = args.shift()
        return this.join(channel)
      },
      'part': (...args) => {
        if (args == null || args.length < 1) return

        const channel = args.shift()
        const message = args.shift()
        return this.part(channel, message)
      },
      'say': (...args) => {
        if (args == null || args.length < 2) return

        const target = args.shift()
        const message = args.shift()
        return this.say(target, message)
      }
    }
  }

  /**
   * Applies event forwarding.
   */
  private installForwards () {
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
   * @param from event name to listen for in client
   * @param to name for forwarding the client event
   */
  private forwardClientEvent (from: string, to: string = from) {
    this.client.on(from, (...args) => {
      this.emit(to, ...args)
    })
  }

  /**
   * Installs client hooks.
   */
  private installClientHooks (): void {
    this.client.on('message', (nick, to, text: string, message) => {
      const trimmedText = text.trim()
      if (trimmedText.startsWith('.') && trimmedText.substring(1, 2) !== '.') {
        // TODO: accept quoted arguments
        const words = _.compact(trimmedText.split(' '))

        if (words.length >= 1) {
          const command = words.shift().substring(1)
          if (command.length > 0) {
            const args = words
            const context = { nick, to, text, message }
            this.emit('command', context, command, ...args)
          }
        }
      }
    })
  }
}

export async function init (config?: Config): Promise<PurpleBot> {
  const bot = new PurpleBot()
  await bot.load(config)
  return bot
}
