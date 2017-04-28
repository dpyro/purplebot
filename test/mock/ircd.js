/**
 * mock ircd server
 *
 * @module mockircd
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
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
 * @extends {EventEmitter}
 */
class MockIrcd extends EventEmitter {
  /**
   * Creates an instance of MockIrcd.
   *
   * @param {string} nick client nick
   * @param {MockIrcd~messageCallback} callback fires on every IRC message from the client
   * @param {boolean} [debug=false] output sent and recieved messages
   *
   * @memberOf MockIrcd
   */
  constructor (nick, callback, debug = false) {
    super()

    /** The server name. */
    this.name = 'mockircd'
    /** Configured client name. */
    this.nick = nick
    /** Flag to print debug info. */
    this.debug = debug
    /** Messages received. */
    this.received = []
    /** Messages sent. */
    this.sent = []

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

        this.incoming = this.received.concat(msg)
      })

      conn.on('end', () => {
        this.emit('end')
      })

      this.on('send', (data) => {
        this.sent.push(data)
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
   * @fires PurpleBot#send
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
   * @param {Array<string>=} additionalNicks
   *
   * @fires PurpleBot#send
   *
   * @memberOf MockIrcd
   */
  join (channel, topic, additionalNicks = []) {
    this.send(`:${this.hostmask} JOIN :${channel}`)
    this.topic(channel, topic)
    this.names(channel, additionalNicks)
  }

  /**
   * Sends a `PART` response to the client.
   *
   * @param {string} channel
   * @param {string} message
   *
   * @fires PurpleBot#send
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
   * @fires PurpleBot#send
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
   * @param {Array<string>=} additionalNicks sent in addition to the configured client nick
   *
   * @fires PurpleBot#send
   *
   * @memberOf MockIrcd
   */
  names (channel, additionalNicks = []) {
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
   * @fires PurpleBot#send
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
   * @fires MockIrcd#send
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

/**
 * Called for every recieved IRC message.
 *
 * @callback MockIrcd~messageCallback
 * @param {string} message
 */

module.exports = MockIrcd
