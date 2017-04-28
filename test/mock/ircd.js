/**
 * mock ircd server
 * based on https://github.com/martynsmith/node-irc/blob/master/test/helpers.js
 */

const EventEmitter = require('events')
const fs = require('fs')
const net = require('net')
const os = require('os')
const path = require('path')

/**
 * Creates a temporary socket and returns its path.
 *
 * @returns {string}
 */
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

/**
 * A mock ircd available in the same thread.
 *
 * @class MockIrcd
 * @extends {EventEmitter}
 */
class MockIrcd extends EventEmitter {
  /**
   * Creates an instance of MockIrcd.
   *
   * @param {string} nick client nick
   * @param {function(string): void} callback fires on every IRC message from the client
   * @param {boolean} [debug=false] output sent and recieved messages
   *
   * @memberOf MockIrcd
   */
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
   * Returns the full hostmask for the client.
   *
   * @return {string}
   *
   * @readonly
   *
   * @memberOf MockIrcd
   */

  get hostmask () {
    return `${this.nick}!${this.user}@${this.host}`
  }

  /**
   * Sends a `REGISTER` response to the client.
   *
   * @param {string} [user='testuser']
   * @param {string} [host='testhost']
   *
   * @memberOf MockIrcd
   */
  register (user = 'testuser', host = 'testhost') {
    this.user = user
    this.host = host
    this.numericReply(1, `:Welcome to the Internet Relay Network ${this.hostmask}`)
  }

  /**
   * Sends a `JOIN` response to the client.
   *
   * @param {string} channel
   * @param {string} topic
   * @param {Array<string>} nicks
   *
   * @memberOf MockIrcd
   */
  join (channel, topic, nicks) {
    this.send(`:${this.hostmask} JOIN :${channel}`)
    this.topic(channel, topic)
    this.names(channel, nicks)
  }

  /**
   * Sends a `PART` response to the client.
   *
   * @param {string} channel
   * @param {string} message
   *
   * @memberOf MockIrcd
   */
  part (channel, message) {
    const output = [`:${this.hostmask} PART ${channel}`, message].filter(x => x).join(' :')
    this.send(output)
  }

  /**
   * Sends a `TOPIC` response to the client.
   * `RPL_TOPIC` is sent if a topic is given, otherwise `RPL_NOTOPIC` is sent.
   *
   * @param {string} channel
   * @param {string=} topic
   *
   * @memberOf MockIrcd
   */
  topic (channel, topic) {
    if (topic == null) {
      this.numericReply(331, `${channel} :No topic is set`)
    } else {
      this.numericReply(332, `${channel} :${topic}`)
    }
  }

  /**
   * Sends a `NAMES` response to the client.
   * A `RPL_NAMEREPLY` message is sent followed by a `RPL_ENDOFNAMES`.
   *
   * @param {string} channel
   * @param {Array<string>} additionalNicks sent in addition to the configured client nick
   *
   * @memberOf MockIrcd
   */
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

  /**
   * Send a message with an appended `CRLF`.
   *
   * @param {string} data
   *
   * @memberOf MockIrcd
   */
  send (data) {
    if (this.debug) {
      console.log(`mockircd → ${data}`)
    }
    this.emit('send', `${data}\r\n`)
  }

  /**
   * Closes the underlying socket.
   *
   * @memberOf MockIrcd
   */
  close () {
    this.server.close()
  }
}

module.exports = MockIrcd
