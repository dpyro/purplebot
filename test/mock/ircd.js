/**
 * mock ircd server
 * based on https://github.com/martynsmith/node-irc/blob/master/test/helpers.js
 */

const EventEmitter = require('events')
const fs = require('fs')
const net = require('net')
const os = require('os')
const path = require('path')

function tmpSocket () {
  const sockPath = path.join(os.tmpdir(), 'mock_ircd.sock')
  // delete socket from previous run
  try {
    fs.unlinkSync(sockPath)
  } catch (e) {
    // pass
  }
  return sockPath
}

class MockIrcd extends EventEmitter {
  constructor (nick, callback, debug = false) {
    super()

    this.name = 'mockircd'
    this.nick = nick
    this.debug = debug
    this.incoming = []
    this.outgoing = []

    this.server = net.createServer((conn) => {
      conn.on('data', (data) => {
        const str = data.toString('utf-8')
        const msg = str.split('\r\n').filter(s => s !== '')

        if (callback != null) {
          for (const line of msg) {
            if (this.debug) {
              console.log(`mockircd ← ${line}`)
            }

            callback(line)
          }
        }

        this.incoming = this.incoming.concat(msg)
      })

      conn.on('end', () => {
        this.emit('end')
      })

      this.on('send', (data) => {
        this.outgoing.push(data)
        conn.write(data)
      })
    })

    this.socket = tmpSocket()
    this.server.listen(this.socket)
  }

  /**
   * @return {string}
   *
   * @readonly
   *
   * @memberOf MockIrcd
   */
  get hostmask () {
    return `${this.nick}!${this.user}@${this.host}`
  }

  register (user = 'testuser', host = 'testhost') {
    this.user = user
    this.host = host
    this.numericReply(1, `:Welcome to the Internet Relay Network ${this.hostmask}`)
  }

  join (channel, topic, nicks) {
    this.send(`:${this.hostmask} JOIN :${channel}`)
    this.topic(channel, topic)
    this.names(channel, nicks)
  }

  part (channel, message) {
    const output = [`:${this.hostmask} PART ${channel}`, message].filter(x => x).join(' :')
    this.send(output)
  }

  topic (channel, topic) {
    if (topic == null) {
      this.numericReply(331, `${channel} :No topic is set`) // RPL_NOTOPIC
    } else {
      this.numericReply(332, `${channel} :${topic}`) // RPL_TOPIC
    }
  }

  names (channel, additionalNicks) {
    const nicks = [this.nick, ...additionalNicks]
    this.numericReply(353, `= ${channel} :${nicks.join(' ')}`)
    this.numericReply(366, `${channel} :End of NAMES list`)
  }

  /**
   * Send a numeric reply to the client.
   * https://tools.ietf.org/html/rfc2812#section-5
   *
   * @param {number|string} numeric
   * @param {string} message
   *
   * @memberOf MockIrcd
   */
  numericReply (numeric, message) {
    if (typeof numeric === 'number') {
      numeric = `000${numeric.toString()}`.substr(-3, 3) // padStart(3, '0')
    }
    this.send(`:${this.name} ${numeric} ${this.nick} ${message}`)
  }

  send (data) {
    if (this.debug) {
      console.log(`mockircd → ${data}`)
    }
    this.emit('send', `${data}\r\n`)
  }

  close () {
    this.server.close()
  }
}

module.exports = MockIrcd
