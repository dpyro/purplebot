const fs = require('fs')

/**
 * Return current timestamp
 *
 * @returns {string}
 */

function join (...args) {
  return args
    .filter((arg) => { return arg != null })
    .join(' ')
}

function fromMessage (message) {
  return message.args.join(' ')
}

function timestamp () {
  return new Date().toUTCString()
}

function writeln (stream, data) {
  stream.write(`[${timestamp()}] ${data}\n`)
}

/**
 * Attach logging listeners to a client.
 *
 * @param {irc.Client} client
 * @param {(string|Buffer|stream.Writable)} output File path, buffer, or writeable stream
 */
function attachLogging (client, output) {
  console.assert(client)
  console.assert(output)

  let stream
  if (typeof output === 'string' || output instanceof Buffer) {
    stream = fs.createWriteStream(output, {
      flags: 'a'
    })
  } else {
    stream = output
  }

  client.addListener('invite', (channel, from, message) => {
    writeln(stream, `INVITE ${from} → ${channel} ${fromMessage(message)}`)
  })

  client.addListener('join', (channel, who) => {
    writeln(stream, `JOINED ${channel}: ${who}`)
  })

  client.addListener('kick', (channel, who, by, reason) => {
    writeln(stream, `KICKED ${channel}: ${join(who, by, reason)}`)
  })

  client.addListener('motd', (motd) => {
    writeln(stream, `MOTD ${motd}`)
  })

  client.addListener('names', (channel, names) => {
    writeln(stream, `NAMES ${channel}: ${names}`)
  })

  client.addListener('notice', (nick, to, text, message) => {
    writeln(stream, `NOTICE ${to}: ${text}`)
  })

  client.addListener('part', (channel, who, reason) => {
    writeln(stream, `PARTED ${channel}: ${join(who, reason)}`)
  })

  client.addListener('pm', (nick, message) => {
    writeln(stream, `PM ${nick}: ${fromMessage(message)}`)
  })
}

module.exports = attachLogging
