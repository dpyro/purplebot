/**
 * @module PurpleBot/plugins
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import fs from 'fs-extra'
import _ from 'lodash'

import Config from '../src/config'

/**
 * @callback listenerCallback
 * @this {EventEmitter}
 * @param {EventEmitter} emitter
 * @param {string} eventName
 * @param {...any} args
 */

/**
 * Adds an exception-catching wrapped listener to an event emitter
 *
 * @param {EventEmitter} emitter
 * @param {string} eventName
 * @param {listenerCallback} callback
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
 */
function timestamp () {
  return new Date().toUTCString()
}

/**
 * Builds and returns logger functions.
 *
 * @returns {Map<string, function(...args): void>} map of logger functions
 */
function getLoggers () {
  const loggers = new Map()

  loggers.set('connect', (server) => {
    return `CONNECT ${server}`
  })
  loggers.set('disconnect', (server, message) => {
    const msg = (message) ? `: ${message}` : ''
    return `DISCONNECT ${server}${msg}`
  })

  loggers.set('action', (from, to, text, message) => {
    return `ACTION ${from} → ${to}: ${text}`
  })
  loggers.set('ctcp-notice', (from, to, text, message) => {
    return `CTCP NOTICE ${from} → ${to}: ${text}`
  })
  loggers.set('ctcp-privmsg', (from, to, text, message) => {
    return `CTCP PRIVMSG ${from} → ${to}: ${text}`
  })
  loggers.set('ctcp-version', (from, to, message) => {
    return `CTCP VERSION ${from} → ${to}`
  })
  loggers.set('invite', (channel, from, message) => {
    return `INVITE ${from} → ${channel}`
  })
  loggers.set('join', (channel, who, message) => {
    return `JOIN ${who} → ${channel}`
  })
  loggers.set('kick', (channel, who, by, reason) => {
    return `KICK ${by} → ${channel}: ${who} ${reason}`
  })
  loggers.set('kill', (nick, reason, channels, message) => {
    return `KILL ${nick} → ${channels.join(' ')}: ${reason}`
  })
  loggers.set('+mode', (channel, by, mode, argument, message) => {
    return _.filter([`MODE ${by} → +${mode} ${channel}`, argument]).join(' ')
  })
  loggers.set('-mode', (channel, by, mode, argument, message) => {
    return _.filter([`MODE ${by} → -${mode} ${channel}`, argument]).join(' ')
  })
  loggers.set('motd', (motd) => {
    return `MOTD ${motd}`
  })
  loggers.set('msg', (nick, to, text, message) => {
    return `${nick} → ${to}: ${text}`
  })
  loggers.set('names', (channel, names) => {
    const nameString = _.toPairs(names).map(([name, mode]) => {
      return `${mode}${name}`
    }).join(' ')
    return `NAMES ${channel}: ${nameString}`
  })
  loggers.set('nick', (oldnick, newnick, channels, message) => {
    return `NICK ${oldnick} → ${newnick} on ${channels.join(' ')}`
  })
  loggers.set('notice', (nick, to, text, message) => {
    const nickString = (nick != null) ? `${nick} → ` : ''
    return `NOTICE ${nickString}${to}: ${text}`
  })
  loggers.set('part', (channel, who, reason) => {
    return `PART ${channel} → ${who}: ${reason}`
  })
  loggers.set('pm', (nick, text, message) => {
    return `PM ${nick}: ${text}`
  })
  loggers.set('quit', (nick, reason, channels, message) => {
    return `QUIT ${nick}: ${reason}`
  })
  loggers.set('registered', (message) => {
    return `REGISTERED`
  })
  loggers.set('selfMessage', (to, text) => {
    return `${to} ← ${text}`
  })
  loggers.set('topic', (channel, topic, nick, message) => {
    return `TOPIC ${nick} → ${channel}: ${topic}`
  })
  loggers.set('whois', (info) => {
    const output = _.toPairs(info).map(([key, value]) => {
      if (_.isArray(value)) {
        value = value.join(' ')
      }
      return `\t${key}: ${value}`
    }).join('\n')

    return `WHOIS\n${output}`
  })

  return loggers
}

/**
 * @external Buffer
 */

/**
 * @external stream
 */

/**
 * @class Writeable
 * @memberof external:stream
 * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_writable Node.js stream.Writeable}
 */

/**
 * Plugin to log sent and recieved messages.
 */
class LoggingPlugin {
  /**
   * Function to create and return a new `LoggingPlugin` instance.
   *
   * @static
   * @param {PurpleBot} bot
   * @param {external:Buffer|external:stream.Writeable} output
   * @returns {Self}
   * @memberOf LoggingPlugin
   */
  static init (bot, output) {
    return new LoggingPlugin(bot, output)
  }

  /**
   * Creates an attached instance of `LoggingPlugin`.
   *
   * @param {PurpleBot} bot
   * @param {Buffer|stream.Writeable} output optional buffer or writeable stream
   * @memberOf LoggingPlugin
   */
  constructor (bot, output) {
    // TODO: set output to server name
    let stream
    if (output != null) {
      stream = output
    } else {
      const filePath = Config.path(`${bot.server}.log`)
      fs.ensureFileSync(filePath)
      stream = fs.createWriteStream(filePath, { flags: 'a' })
    }

    const loggers = getLoggers()
    for (let [eventName, callback] of loggers) {
      onSafe(bot, eventName, (...args) => {
        const data = callback.apply(null, args)
        const line = `[${timestamp()}] ${data}\n`
        stream.write(line)
      })
    }
  }
}

module.exports = LoggingPlugin.init
