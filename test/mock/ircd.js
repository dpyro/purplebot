/**
 * mock ircd server
 * based on https://github.com/martynsmith/node-irc/blob/master/test/helpers.js
 */

const EventEmitter = require('events')
const net = require('net')

class MockIrcd extends EventEmitter {
  constructor (encoding = 'utf-8') {
    super()

    this.incoming = []
    this.outgoing = []

    this.server = net.createServer((conn) => {
      console.log('connect:')

      conn.on('data', (data) => {
        const str = data.toString(encoding)

        console.log(`data: ${str}`)

        const msg = str.split('\r\n')
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

    this.server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`MockIrcd: port in use, retrying...`)
        this.server.close()
        this.server.listen()
      }
    })

    this.server.listen()
  }

  get port () {
    return this.server.port
  }

  send (data) {
    this.emit('send', data)
  }

  close () {
    this.server.close()
  }
}

module.exports = MockIrcd
