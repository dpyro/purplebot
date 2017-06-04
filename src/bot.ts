/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import { EventEmitter } from 'events'
import * as irc from 'irc'
import * as _ from 'lodash'

import { CommandMap } from './cli'
import Config, { MemConfig } from './config'
import loadAll, { Plugin } from './plugins'
import { User, UserDatabase } from './user'

export class Context {
  nick: string
  user: string
  host: string
  to: string
  text?: string
  message?: any

  async getUser (userDb: UserDatabase): Promise<User | null> {
    const users = await userDb.matchUsersHostmask(this.nick, this.user, this.host)

    if (users.length < 1 || users.length > 1) {
      return null
    }

    return users[0]
  }
}

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
  userDb: UserDatabase

  /**
   * Loads the config and plugins and then connects to the configured server.
   *
   * @todo parallelize the awaits
   */
  async load (config?: Config): Promise<void> {
    this.config = config || new MemConfig()
    this.config.nconf.defaults({
      channels: [],
      debug: false,
      nick: 'PurpleBot',
      server: 'localhost',
      socket: false
    })

    this.debug = !!await this.config.get('debug')
    this.server = await this.config.get('server')
    const nick = await this.config.get('nick')
    const channels = await this.config.get('channels')

    const clientOptions = {
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

    await this.loadUserDatabase()
    this.loadHooks()
    this.loadCommandHooks()
    this.loadForwards()

    const pluginsEnabled = await this.config.get('plugins')
    if (pluginsEnabled !== false) {
      this.plugins = await loadAll(this)
    }
  }

  getPlugin (name: string): Plugin | null {
    for (const plugin of this.plugins) {
      if (name === plugin.name) {
        return plugin
      }
    }
    return null
  }

  /**
   * Connect to the IRC server.
   *
   * @fires connect
   */
  async connect (): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.connect(() => {
        this.emit('connect', this.server)
        resolve(this.server)
      })
    })
  }

  /**
   * Disconnect from the IRC server.
   *
   * @fires disconnect
   */
  async disconnect (message?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.disconnect(message!, () => {
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
   * @fires join
   */
  async join (channel: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.join(channel, () => {
        this.emit('join', channel)
        resolve(channel)
      })
    })
  }

  /**
   * Parts the bot from an IRC channel.
   *
   * @returns the parted channel
   *
   * @fires part
   */
  async part (channel: string, message?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.part(channel, message!, () => {
        this.emit('part', channel, message)
        resolve(channel)
      })
    })
  }

  /**
   * Sends a message to the target.
   */
  say (target: string, message: string): void {
    this.client.say(target, message)
  }

  setNick (nick: string): void {
    this.client.send('NICK', nick)
  }

  /**
   * String representation.
   */
  toString (): string {
    return `[PurpleBot: ${this.server}]`
  }

  /**
   * Current nick of the bot.
   */
  get nick (): string | null {
    return this.client.nick
  }

  /**
   * Updated channel info from the client.
   */
  get chans () {
    return this.client.chans
  }

  // TODO: expand beyond user's irc channel mode
  getUser (nick: string, channel: string): string {
    return this.client.chans[channel].users[nick]
  }

  protected async loadUserDatabase (): Promise<void> {
    this.userDb = new UserDatabase()
    await this.userDb.load(this.config)
  }

  /**
   * Creates and populates `this.commands`.
   */
  protected loadCommandHooks (): void {
    this.commands = {
      'connect': this.connect.bind(this),
      'disconnect': this.disconnect.bind(this),
      'join': (...args) => {
        if (args.length < 1) return

        const channel = args.shift()
        return this.join(channel)
      },
      'part': (...args) => {
        if (args.length < 1) return

        const channel = args.shift()
        const message = args.shift()
        return this.part(channel, message)
      },
      'say': (...args) => {
        if (args.length < 2) return

        const target = args.shift()
        const message = args.shift()
        return this.say(target, message)
      }
    }
  }

  /**
   * Applies event forwarding.
   */
  protected loadForwards () {
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
  protected forwardClientEvent (from: string, to: string = from) {
    this.client.on(from, (...args: any[]) => {
      this.emit(to, ...args)
    })
  }

  /**
   * Installs client hooks.
   *
   * @listens message
   * @fires command
   */
  private loadHooks (): void {
    this.on('message', (nick: string, to: string, text: string, message) => {
      const trimmedText = text.trim()
      // TODO: allow omitting . if sent as pm
      if (trimmedText.startsWith('.') && trimmedText.substring(1, 2) !== '.') {
        // TODO: accept quoted arguments
        const words = _.compact(trimmedText.split(' '))

        if (words.length >= 1) {
          const command = words.shift()!.substring(1)
          if (command.length > 0) {
            const user = message.user
            const host = message.host
            const args = words

            const context = new Context()
            context.nick = nick
            context.user = user
            context.host = host
            context.to = to
            context.text = text
            context.message = message
            this.emit('command', context, command, ...args)
          }
        }
      }
    })

    // Auth
    this.on('connect', async (server) => {
      const nickname = await this.config.get('auth:nick')
      if (nickname == null) return false
      const password = await this.config.get('auth:pass')

      if (password != null && password !== '') {
        this.say('NickServ', `GHOST ${nickname} ${password}`)
      }
      this.setNick(nickname)
      if (password != null && password !== '') {
        this.say('NickServ', `IDENTIFY ${password}`)
      }
    })
  }
}

/**
 * Create and load a `PurpleBot` with the given configuration.
 */
export async function init (config?: Config): Promise<PurpleBot> {
  const bot = new PurpleBot()
  await bot.load(config)
  return bot
}
