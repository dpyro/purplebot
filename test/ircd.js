const expect = require('chai').expect

const MockIrcd = require('./mock/ircd')
const PurpleBot = require('../src/bot')

const responses = new Map()
responses.set(/user \w+ \d \* \w+/i, (ircd) => {
  ircd.send(':localhost 001 testbot :Welcome to the MockIrcd Chat Network testbot\r\n')
})

describe('mock ircd', function () {
  this.timeout(6000)

  function botWithMock () {
    function callback (data) {
      for (const [regex, action] of responses) {
        if (data.match(regex)) {
          action(ircd)
          break
        }
      }
    }

    const ircd = new MockIrcd(callback)
    const socket = ircd.socket
    const bot = new PurpleBot({
      server: socket,
      socket: true
    })

    expect(bot).to.exist
    expect(ircd).to.exist

    return [bot, ircd]
  }

  it('setup', () => {
    botWithMock()
  })

  it('connect', (done) => {
    const [bot, ircd] = botWithMock()

    bot.on('connect', () => { done() })

    bot.connect()
  })

  it('disconnect', (done) => {
    const [bot, ircd] = botWithMock()

    bot.on('disconnect', () => { done() })

    bot.connect(() => {
      bot.disconnect()
    })
  })

  it('register', (done) => {
    const [bot, ircd] = botWithMock()

    bot.on('register', () => { done() })

    bot.connect()
  })
})
