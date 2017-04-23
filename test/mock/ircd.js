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
  constructor (callback) {
    super()

    this.incoming = []
    this.outgoing = []

    this.server = net.createServer((conn) => {
      conn.on('data', (data) => {
        const str = data.toString('utf-8')
        const msg = str.split('\r\n')

        if (callback != null) {
          for (const line of msg) {
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

  send (data) {
    this.emit('send', data)
  }

  close () {
    this.server.close()
  }
}

module.exports = MockIrcd
