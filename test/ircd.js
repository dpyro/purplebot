const expect = require('chai').expect

const MockIrcd = require('./mock/ircd')
const PurpleBot = require('../src/bot')

describe('mock ircd', function () {
  this.timeout(6000)

  function botWithMock () {
    function callback (data) {
      if (data.match(/user \w+ \d \* \w+/i)) {
        ircd.send(':localhost 001 testbot :Welcome to the MockIrcd Chat Network testbot\r\n')
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

    bot.connect(done)
  })

  it('disconnect', (done) => {
    const [bot, ircd] = botWithMock()

    bot.connect(() => {
      bot.disconnect(done)
    })
  })
})
