const expect = require('chai').expect

const PurpleBot = require('../src/bot')

describe('bot', function () {
  it('new PurpleBot()', function () {
    const bot = new PurpleBot()
    expect(bot).to.exist
  })
})
