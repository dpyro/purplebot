import { expect } from 'chai'

import PurpleBot from '../src/bot'

describe('bot', function () {
  this.timeout(5000)

  it('new', () => {
    const bot = new PurpleBot()
    expect(bot).to.exist
  })

  function forwardClientEventBot (done) {
    const bot = new PurpleBot()

    expect(bot).to.exist

    bot.on('testout', (arg) => {
      if (arg) {
        expect(arg).to.string('arg')
      }
      done()
    })

    return bot
  }

  it('#forwardClientEvent 1', (done) => {
    const bot = forwardClientEventBot(done)
    bot.forwardClientEvent('test1', 'testout')

    expect(bot.client.emit('test1', 'arg')).is.true
  })

  it('#forwardClientEvent 2', (done) => {
    const bot = forwardClientEventBot(done)
    bot.forwardClientEvent('testout')

    expect(bot.client.emit('testout', 'arg')).is.true
  })
})
