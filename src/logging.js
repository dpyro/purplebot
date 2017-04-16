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

function writeln (stream, data) {
  stream.write(`[${timestamp()}] ${data}\n`)
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
 * @param {!irc.Client} client
 * @param {!(string|Buffer|stream.Writable)} output File path, buffer, or writeable stream
 */
function attachLogging (client, output) {
  let stream
  if (typeof output === 'string' || output instanceof Buffer) {
    stream = fs.createWriteStream(output, { flags: 'a' })
  } else {
    stream = output
  }

  addSafeListener(client, 'invite', (channel, from, message) => {
    writeln(stream, `INVITE ${from} → ${channel}`)
  })

  addSafeListener(client, 'join', (channel, who) => {
    writeln(stream, `JOINED ${channel}: ${who}`)
  })

  addSafeListener(client, 'kick', (channel, who, by, reason) => {
    writeln(stream, `KICKED ${channel}: ${join(who, by, reason)}`)
  })

  addSafeListener(client, 'motd', (motd) => {
    writeln(stream, `MOTD ${motd}`)
  })

  addSafeListener(client, 'names', (channel, names) => {
    const strs = []
    for (let [name, mode] in names) {
      strs.push(`${mode}${name}`)
    }
    const nameString = strs.join(' ')

    writeln(stream, `NAMES ${channel}: ${nameString}`)
  })

  addSafeListener(client, 'notice', (nick, to, text, message) => {
    writeln(stream, `NOTICE ${to}: ${text}`)
  })

  addSafeListener(client, 'part', (channel, who, reason) => {
    writeln(stream, `PARTED ${channel}: ${join(who, reason)}`)
  })

  addSafeListener(client, 'pm', (nick, message) => {
    writeln(stream, `PM ${nick}: ${message.args.join(' ')}`)
  })

  addSafeListener(client, 'quit', (nick, reason, channels, message) => {
    writeln(stream, `QUIT ${nick}: ${reason}`)
  })

  addSafeListener(client, 'registered', (message) => {
    writeln(stream, 'REGISTERED')
  })

  addSafeListener(client, 'topic', (channel, topic, nick, message) => {
    writeln(stream, `TOPIC ${channel}: (${nick}) ${topic}`)
  })
}

module.exports = attachLogging
