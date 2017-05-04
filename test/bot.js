import 'babel-polyfill'
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

  it('forwardClientEvent(): 1 ', (done) => {
    bot.on('testout', (arg) => {
      expect(arg).to.equal('arg')
      done()
    })

    bot.forwardClientEvent('test1', 'testout')
    expect(bot.client.emit('test1', 'arg')).is.true
  })

  it('forwardClientEvent(): 2', (done) => {
    bot.on('testout', (arg) => {
      expect(arg).to.equal('arg')
      done()
    })

    bot.forwardClientEvent('testout')
    expect(bot.client.emit('testout', 'arg')).is.true
  })
})
