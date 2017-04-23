const expect = require('chai').expect

const MockIrcd = require('./mock/ircd')
const PurpleBot = require('../src/bot')

describe('mock ircd', function () {
  this.timeout(5000)

  function botWithMock () {
    const ircd = new MockIrcd()
    const port = ircd.port
    const bot = new PurpleBot(port)

    expect(bot).to.exist
    expect(ircd).to.exist

    return [bot, ircd]
  }

  it('setup', () => {
    botWithMock()
  })

  it('connect', (done) => {
    this.retries(2)

    const [bot, ircd] = botWithMock()

    bot.connect(done)
  })
})
