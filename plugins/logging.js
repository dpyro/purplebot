/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import fs from 'fs-extra'
import _ from 'lodash'

import Config from '../src/config'

/**
 * Adds an exception-catching wrapped listener to an event emitter
 *
 * @param {NodeJS.EventEmitter} emitter
 * @param {string} eventName
 * @param {function(this:NodeJS.EventEmitter, ...any): void} callback
 *
 * @private
 */
function onSafe (emitter, eventName, callback) {
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
 *
 * @returns {string}
 *
 * @private
 */
function timestamp () {
  return new Date().toUTCString()
}

/**
 * Logger functions.
 *
 * @type {Object<string, function(...any): string>}
 *
 * @private
 */
const loggers = {
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

/**
 * Plugin for logging sent and recieved messages.
 *
 * @implements {Plugin}
 */
class LoggingPlugin {
  /**
   * Creates an attached instance of `LoggingPlugin`.
   *
   * @param {any} bot
   * @param {NodeBuffer} [output=null] optional buffer or writeable stream
   *
   * @memberOf LoggingPlugin
   *
   * @todo set socket server file name to server name
   */
  constructor (bot, output = null) {
    let stream
    if (output != null) {
      stream = output
    } else {
      this.config = new Config()
      const filePath = this.config.path(`${bot.server}.log`)
      fs.ensureFileSync(filePath)
      stream = fs.createWriteStream(filePath, { flags: 'a' })
    }

    for (let eventName of Object.keys(loggers)) {
      const callback = loggers[eventName]
      onSafe(bot, eventName, (...args) => {
        const data = callback.apply(null, args)
        const line = `[${timestamp()}] ${data}\n`
        stream.write(line)
      })
    }
  }
}

function init (bot, config) {
  return new LoggingPlugin(bot, config)
}

export default init
export { LoggingPlugin }
