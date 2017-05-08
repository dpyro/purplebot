/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import { ensureFile, createWriteStream } from 'fs-extra'
import * as _ from 'lodash'

import Config from '../src/config'
import PurpleBot from '../src/bot'
import { Plugin } from '../src/plugins'

/**
 * Adds an exception-catching wrapped listener to an event emitter
 */
function onSafe (emitter,
                 eventName: string,
                 callback: (...args: any[]) => void) {
  emitter.on(eventName, (...args) => {
    try {
      callback.apply(emitter, args)
    } catch (e) {
      console.error(e)
    }
  })
}

/**
 * Return the current timestamp.
 */
function timestamp (): string {
  return new Date().toUTCString()
}

/**
 * Plugin for logging sent and recieved messages.
 */
export default class LoggingPlugin implements Plugin {
  /**
   * Logger functions.
   */
  protected static loggers = {
    'connect': (server) => {
      return `CONNECT ${server}`
    },
    'disconnect': (server, message) => {
      const msg = (message) ? `: ${message}` : ''
      return `DISCONNECT ${server}${msg}`
    },
    'action': (from, to, text, message) => {
      return `ACTION ${from} → ${to}: ${text}`
    },
    'ctcp-notice': (from, to, text, message) => {
      return `CTCP NOTICE ${from} → ${to}: ${text}`
    },
    'ctcp-privmsg': (from, to, text, message) => {
      return `CTCP PRIVMSG ${from} → ${to}: ${text}`
    },
    'ctcp-version': (from, to, message) => {
      return `CTCP VERSION ${from} → ${to}`
    },
    'invite': (channel, from, message) => {
      return `INVITE ${from} → ${channel}`
    },
    'join': (channel, who, message) => {
      return `JOIN ${who} → ${channel}`
    },
    'kick': (channel, who, by, reason) => {
      return `KICK ${by} → ${channel}: ${who} ${reason}`
    },
    'kill': (nick, reason, channels, message) => {
      return `KILL ${nick} → ${channels.join(' ')}: ${reason}`
    },
    '+mode': (channel, by, mode, argument, message) => {
      return [`MODE ${by} → +${mode} ${channel}`, argument].filter(e => e).join(' ')
    },
    '-mode': (channel, by, mode, argument, message) => {
      return [`MODE ${by} → -${mode} ${channel}`, argument].filter(e => e).join(' ')
    },
    'motd': (motd) => {
      return `MOTD ${motd}`
    },
    'msg': (nick, to, text, message) => {
      return `${nick} → ${to}: ${text}`
    },
    'names': (channel, names) => {
      const nameString = _.toPairs(names).map(([name, mode]) => {
        return `${mode}${name}`
      }).join(' ')
      return `NAMES ${channel}: ${nameString}`
    },
    'nick': (oldnick, newnick, channels, message) => {
      return `NICK ${oldnick} → ${newnick} on ${channels.join(' ')}`
    },
    'notice': (nick, to, text, message) => {
      const nickString = (nick != null) ? `${nick} → ` : ''
      return `NOTICE ${nickString}${to}: ${text}`
    },
    'part': (channel, who, reason) => {
      return `PART ${channel} → ${who}: ${reason}`
    },
    'pm': (nick, text, message) => {
      return `PM ${nick}: ${text}`
    },
    'quit': (nick, reason, channels, message) => {
      return `QUIT ${nick}: ${reason}`
    },
    'registered': (message) => {
      return `REGISTERED`
    },
    'selfMessage': (to, text) => {
      return `${to} ← ${text}`
    },
    'topic': (channel, topic, nick, message) => {
      return `TOPIC ${nick} → ${channel}: ${topic}`
    },
    'whois': (info) => {
      const output = _.toPairs(info).map(([key, value]) => {
        if (_.isArray(value)) {
          value = value.join(' ')
        }
        return `\t${key}: ${value}`
      }).join('\n')

      return `WHOIS\n${output}`
    }
  }

  bot: PurpleBot
  config: Config
  output: NodeBuffer

  constructor (output: NodeBuffer = null) {
    this.output = output
  }

  /**
   * Creates an attached instance of `LoggingPlugin`.
   *
   * @todo set socket server file name to server name
   */
  async load (bot: PurpleBot, config?: Config): Promise<void> {
    this.bot = bot
    this.config = config || new Config()

    let stream
    if (this.output != null) {
      stream = this.output
    } else {
      const filePath = this.config.path(`${this.bot.server}.log`)
      await ensureFile(filePath)
      stream = createWriteStream(filePath, { flags: 'a' })
    }

    for (let eventName of Object.keys(LoggingPlugin.loggers)) {
      const callback = LoggingPlugin.loggers[eventName]
      onSafe(this.bot, eventName, (...args) => {
        const data = callback.apply(null, args)
        const line = `[${timestamp()}] ${data}\n`
        stream.write(line)
      })
    }
  }
}
