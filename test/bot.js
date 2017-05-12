import 'babel-polyfill'
import { expect } from 'chai'

import { init } from '../src/bot'
import { MemConfig } from '../src/config'

describe('bot', function () {
  this.timeout(5000)

  let bot, config

  before(function () {
    config = new MemConfig()
    config.set('plugins', false)
  })

  beforeEach(async function () {
    bot = await init(config)
    expect(bot).to.exist
  })

  it('forwardClientEvent(): 1 ', done => {
    bot.on('testout', (arg) => {
      expect(arg).to.equal('arg')
      done()
    })

    bot.forwardClientEvent('test1', 'testout')
    expect(bot.client.emit('test1', 'arg')).is.true
  })

  it('forwardClientEvent(): 2', done => {
    bot.on('testout', (arg) => {
      expect(arg).to.equal('arg')
      done()
    })

    bot.forwardClientEvent('testout')
    expect(bot.client.emit('testout', 'arg')).is.true
  })
})
