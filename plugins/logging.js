const fs = require('fs')
const _ = require('lodash')

/**
 * Return current timestamp
 *
 * @returns {!string}
 */
function timestamp () {
  return new Date().toUTCString()
}

/**
 * Builds and returns logger functions
 *
 * @returns {Map<string, function(...args): string>} map of logger functions
 */
function getLoggers () {
  const loggers = new Map()

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
  loggers.set('notice', (nick, to, text, message) => {
    return `NOTICE ${nick} → ${to}: ${text}`
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
 * Adds an exception-catching wrapped listener to an event emitter
 *
 * @param {!event.EventEmitter} emitter
 * @param {!any} eventName
 * @param {!function(...any): void} callback
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
 * Attach logging listeners to a client.
 *
 * @param {!EventEmitter} emitter the client
 * @param {!(string|Buffer|stream.Writable)} output file path, buffer, or writeable stream
 */
function run (emitter, output) {
  let stream
  if (typeof output === 'string' || output instanceof Buffer) {
    stream = fs.createWriteStream(output, { flags: 'a' })
  } else {
    stream = output
  }

  const loggers = getLoggers()
  for (let [eventName, callback] of loggers) {
    onSafe(emitter, eventName, (...args) => {
      const data = callback.apply(null, args)
      const line = `[${timestamp()}] ${data}\n`
      stream.write(line)
    })
  }
}

module.exports = run
