import 'babel-polyfill'
import { expect } from 'chai'

import { init } from '../src/bot'

describe('bot', function () {
  this.timeout(5000)

  let bot

  beforeEach(async function () {
    bot = await init()
    expect(bot).to.exist
  })

  it('forwardClientEvent(): 1 ', done => {
    bot.on('testout', (arg) => {
      expect(arg).to.equal('arg')
      done()
    })

    bot._forwardClientEvent('test1', 'testout')
    expect(bot.client.emit('test1', 'arg')).is.true
  })

  it('forwardClientEvent(): 2', done => {
    bot.on('testout', (arg) => {
      expect(arg).to.equal('arg')
      done()
    })

    bot._forwardClientEvent('testout')
    expect(bot.client.emit('testout', 'arg')).is.true
  })
})
