const expect = require('chai').expect

const PurpleBot = require('../src/bot')

describe('plugin: url', function () {
  let bot
  beforeEach(function () {
    bot = new PurpleBot()

    expect(bot).to.exist
  })

  it('emits on valid url', function (done) {
    bot.on('url', () => { done() })

    expect(bot.client.emit('message#', 'someone', '#test', 'http://example.local/')).is.true
  })

  it('does not emit on invalid url', function (done) {
    let error = false
    bot.on('url', () => { error = true })

    expect(bot.client.emit('message#', 'someone', '#test', 'http://:example.local/')).is.true

    if (error) {
      done(new Error())
    } else {
      done()
    }
  })
})
