import { expect } from 'chai'

import initBot from '../src/bot'

describe('bot', function () {
  this.timeout(5000)

  let bot

  beforeEach(function () {
    return initBot()
      .then((newBot) => {
        expect(newBot).to.exist
        bot = newBot
        newBot
      })
  })

  it('new', function () {})

  async function forwardClientEventBot (done) {
    return Promise.resolve()
      .then(() => {
        bot.on('testout', (arg) => {
          if (arg) {
            expect(arg).to.string('arg')
          }
          done()
        })
      })
  }

  it('#forwardClientEvent 1', (done) => {
    forwardClientEventBot(done)
      .then(() => {
        bot.forwardClientEvent('test1', 'testout')
        expect(bot.client.emit('test1', 'arg')).is.true
      })
  })

  it('#forwardClientEvent 2', (done) => {
    forwardClientEventBot(done)
      .then(() => {
        bot.forwardClientEvent('testout')
        expect(bot.client.emit('testout', 'arg')).is.true
      })
  })
})
