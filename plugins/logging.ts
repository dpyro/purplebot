/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import * as fs from 'fs-extra'
import * as _ from 'lodash'
import * as stream from 'stream'

import Config, { FileConfig } from '../src/config'
import PurpleBot from '../src/bot'
import { Plugin } from '../src/plugins'

/**
 * Plugin for logging sent and recieved messages.
 */
export default class LoggingPlugin implements Plugin {
  readonly name = 'logging'
  bot: PurpleBot
  config: Config
  output: NodeBuffer | stream.Writable | undefined

  /**
   * Logger functions.
   */
  protected loggers: {[key in string]: (...args: any[]) => void} = {
    'connect': (server) =>
      `CONNECT ${server}`,

    'disconnect': (server, message) => {
      const msg = (message) ? `: ${message}` : ''
      return `DISCONNECT ${server}${msg}`
    },

    'action': (from, to, text, message) =>
      `ACTION ${from} → ${to}: ${text}`,

    'ctcp-notice': (from, to, text, message) =>
      `CTCP NOTICE ${from} → ${to}: ${text}`,

    'ctcp-privmsg': (from, to, text, message) =>
      `CTCP PRIVMSG ${from} → ${to}: ${text}`,

    'ctcp-version': (from, to, message) =>
      `CTCP VERSION ${from} → ${to}`,

    'invite': (channel, from, message) =>
      `INVITE ${from} → ${channel}`,

    'join': (channel, who, message) =>
      `JOIN ${who} → ${channel}`,

    'kick': (channel, who, by, reason) =>
      `KICK ${by} → ${channel}: ${who} ${reason}`,

    'kill': (nick, reason, channels, message) =>
      `KILL ${nick} → ${channels.join(' ')}: ${reason}`,

    '+mode': (channel, by, mode, argument, message) =>
      _.compact([`MODE ${by} → +${mode} ${channel}`, argument]).join(' '),

    '-mode': (channel, by, mode, argument, message) =>
      _.compact([`MODE ${by} → -${mode} ${channel}`, argument]).join(' '),

    'motd': (motd) =>
      `MOTD ${motd}`,

    'msg': (nick, to, text, message) =>
      `${nick} → ${to}: ${text}`,

    'names': (channel, names) => {
      const nameString = _.toPairs(names).map(([name, mode]) => {
        return `${mode}${name}`
      }).join(' ')
      return `NAMES ${channel}: ${nameString}`
    },

    'nick': (oldnick, newnick, channels, message) =>
      `NICK ${oldnick} → ${newnick} on ${channels.join(' ')}`,

    'notice': (nick, to, text, message) => {
      const nickString = (nick != null) ? `${nick} → ` : ''
      return `NOTICE ${nickString}${to}: ${text}`
    },

    'part': (channel, who, reason) =>
      `PART ${channel} → ${who}: ${reason}`,

    'pm': (nick, text, message) =>
      `PM ${nick}: ${text}`,

    'quit': (nick, reason, channels, message) =>
      `QUIT ${nick}: ${reason}`,

    'registered': (message) =>
      `REGISTERED`,

    'selfMessage': (to, text) =>
      `${to} ← ${text}`,

    'topic': (channel, topic, nick, message) =>
      `TOPIC ${nick} → ${channel}: ${topic}`,

    'whois': (info) => {
      const output = _.toPairs(info).map(([key, value]) => {
        if (Array.isArray(value)) {
          value = value.join(' ')
        }
        return `\t${key}: ${value}`
      }).join('\n')

      return `WHOIS\n${output}`
    }
  }

  constructor (output?: NodeBuffer | stream.Writable) {
    this.output = output
  }

  /**
   * Creates an attached instance of `LoggingPlugin`.
   *
   * @todo set socket server file name to server name
   */
  async load (bot: PurpleBot): Promise<void> {
    this.bot = bot
    this.config = bot.config

    let stream
    if (this.output != null) {
      stream = this.output
    } else {
      if (!(this.config instanceof FileConfig)) throw new Error()

      const filePath = this.config.path(`${this.bot.server}.log`)
      await fs.ensureFile(filePath)
      stream = fs.createWriteStream(filePath, { flags: 'a' })
    }

    this.installHooks(stream)
  }

  toString (): string {
    return `[LoggingPlugin ${this.output}]`
  }

  private installHooks (stream: fs.WriteStream): void {
    for (const eventName of Object.keys(this.loggers)) {
      const callback = this.loggers[eventName]
      this.bot.on(eventName, (...args) => {
        try {
          const data = callback.apply(this.bot, args)
          const timestamp = new Date().toUTCString()
          const line = `[${timestamp}] ${data}\n`
          stream.write(line)
        } catch (err) {
          console.error(err)
        }
      })
    }
  }
}
