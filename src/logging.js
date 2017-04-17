const fs = require('fs')
const _ = require('lodash')

/**
 * Join the provided arguments with a space
 *
 * @param {...string} args
 * @returns {!string}
 */
function join (...args) {
  return _.compact(args).join(' ')
}

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
  loggers.set('motd', (motd) => {
    return `MOTD ${motd}`
  })
  loggers.set('msg', (nick, to, text, message) => {
    return `${nick} → ${to}: ${text}`
  })
  loggers.set('names', (channel, names) => {
    const strs = []
    for (let [name, mode] in names) {
      strs.push(`${mode}${name}`)
    }
    const nameString = strs.join(' ')
    return `NAMES ${channel}: ${nameString}`
  })
  loggers.set('notice', (nick, to, text, message) => {
    return `NOTICE ${nick} → ${to}: ${text}`
  })
  loggers.set('part', (channel, who, reason) => {
    return `PART ${channel} → ${who}: ${reason}`
  })
  loggers.set('pm', (nick, message) => {
    return `PM ${nick}: ${message.args.join(' ')}`
  })
  loggers.set('quit', (nick, reason, channels, message) => {
    return `QUIT ${nick}: ${reason}`
  })
  loggers.set('registered', (message) => {
    return `REGISTERED`
  })
  loggers.set('selfMessage', (to, text) => {
    return `MSG ${to}: ${text}`
  })
  loggers.set('topic', (channel, topic, nick, message) => {
    return `TOPIC ${nick} → ${channel}: ${topic}`
  })
  loggers.set('whois', (info) => {
    return [
      `WHOIS ${info.nick}`,
      `\tuser: ${info.user}`,
      `\thost: ${info.host}`,
      `\treal: ${info.realname}`,
      `\tchan: ${info.channels.join(' ')}`,
      `\tserv: ${info.server}`,
      `\tinfo: ${info.serverinfo}`,
      `\toper: ${info.operator}`
    ].join('\n')
  })

  return loggers
}

/**
 * Adds an exception-catching wrapped listener to an event emitter
 *
 * @param {!event.EventEmitter} emitter
 * @param {any} eventName
 * @param {function(...any): void} callback
 */
function addSafeListener (emitter, eventName, callback) {
  emitter.addListener(eventName, (...args) => {
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
function attachLogging (emitter, output) {
  let stream
  if (typeof output === 'string' || output instanceof Buffer) {
    stream = fs.createWriteStream(output, { flags: 'a' })
  } else {
    stream = output
  }

  const loggers = getLoggers()
  for (let [eventName, callback] of loggers) {
    addSafeListener(emitter, eventName, (...args) => {
      const data = callback.apply(null, args)
      const line = `[${timestamp()}] ${data}\n`
      stream.write(line)
    })
  }
}

module.exports = attachLogging
