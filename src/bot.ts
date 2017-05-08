/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import { EventEmitter }  from 'events'
import * as irc from 'irc'

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
 *
 * @memberof module:purplebot
 */
export default class PurpleBot extends EventEmitter implements CommandMap {
  client: irc.Client
  server: string
  commands: {[key in string]: (...any) => void}
  plugins: Plugin[]

  /**
   * Creates an instance of PurpleBot.
   *
   * @memberOf PurpleBot
   */
  constructor (options?: any) {
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

    this._installClientHooks()
    this._setupCommandHooks()
    this._installForwards()
  }

  /**
   * Installs client hooks.
   *
   * @memberof PurpleBot
   */
  private _installClientHooks (): void {
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
  }

  async loadPlugins (): Promise<void> {
    this.plugins = await loadPlugins(this)
  }

  /**
   * Creates and populates `this.commands`.
   *
   * @memberOf PurpleBot
   */
  private _setupCommandHooks (): void {
    this.commands = {
      'connect': this.connect.bind(this),
      'disconnect': this.disconnect.bind(this),
      'join': (...args) => {
        if (args == null || args.length < 1) return

        const channel = args.shift()
        this.join(channel)
      },
      'part': (...args) => {
        if (args == null || args.length < 1) return

        const channel = args.shift()
        const message = args.shift()
        this.part(channel, message)
      },
      'say': (...args) => {
        if (args == null || args.length < 2) return

        const target = args.shift()
        const message = args.shift()
        this.say(target, message)
      }
    }
  }

  /**
   * Applies event forwarding.
   *
   * @memberOf PurpleBot
   */
  private _installForwards () {
    this._forwardClientEvent('error')

    this._forwardClientEvent('action')
    this._forwardClientEvent('invite')
    this._forwardClientEvent('kill')
    this._forwardClientEvent('message')
    this._forwardClientEvent('message#')
    this._forwardClientEvent('+mode')
    this._forwardClientEvent('-mode')
    this._forwardClientEvent('motd')
    this._forwardClientEvent('names')
    this._forwardClientEvent('notice')
    this._forwardClientEvent('pm')
    this._forwardClientEvent('quit')
    this._forwardClientEvent('registered', 'register')
    this._forwardClientEvent('selfMessage', 'self')
    this._forwardClientEvent('topic')
  }

  /**
   * Enable an event forward from `this.client` -> `this`.
   *
   * @param from event name to listen for in client
   * @param to name for forwarding the client event
   *
   * @memberOf PurpleBot
   */
  private _forwardClientEvent (from: string, to: string = from) {
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
   * @memberOf PurpleBot
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
   * @memberOf PurpleBot
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
   * @memberOf PurpleBot
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
   * @memberOf PurpleBot
   */
  say (target: string, message: string): void {
    this.client.say(target, message)
  }

  /**
   * String representation
   *
   * @memberOf PurpleBot
   */
  toString (): string {
    return `[PurpleBot: ${this.server}]`
  }

  /**
   * Current nick of the bot.
   *
   * @readonly
   * @memberOf PurpleBot
   */
  get nick (): string {
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

export async function init (options?: any): Promise<PurpleBot> {
  const bot = new PurpleBot(options)
  await bot.loadPlugins()
  return bot
}
