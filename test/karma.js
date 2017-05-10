import 'babel-polyfill'
import { expect } from 'chai'
import { EventEmitter } from 'events'

import Config from '../src/config'
import KarmaPlugin from '../plugins/karma'

describe('plugin: karma', async function () {
  this.timeout(4000)

  const nick = 'chameleon'
  const channel = '#test'
  let emitter, plugin, config

  // TODO: use custom test config
  beforeEach(async function () {
    config = await Config.temp()

    emitter = new EventEmitter()
    emitter.say = () => {}

    plugin = new KarmaPlugin()
    await plugin.load(emitter, config)
    expect(plugin).to.exist

    await plugin.resetDatabase()
    const output = await plugin.top()
    expect(output).to.be.empty
  })

  afterEach(async function () {
    await config.removeDir()
    config = null
  })

  it('top() [empty]', async function () {
    const results = await plugin.top()
    expect(results).to.be.empty
  })

  it('get() [empty]', async function () {
    const result = await plugin.get('term')
    expect(result).to.not.exist
  })

  const checkValid = (name, message, result) => {
    it(`${name}: "${message}"`, function (done) {
      emitter.on('karma.respond', (fromNick, to, term, karma) => {
        try {
          expect(fromNick).to.equal(nick)
          expect(to).to.equal(channel)
          expect(term).to.equal('term')
          expect(karma).to.equal(result)
          done()
        } catch (error) {
          done(error)
        }
      })

      emitter.emit('message#', nick, channel, message)
    })
  }

  const increments = ['term++', ' term++', 'term++ ', 'this term++']
  for (const increment of increments) {
    checkValid('increments', increment, 1)
  }

  const decrements = ['term--', ' term--', 'term-- ', 'another term--']
  for (const decrement of decrements) {
    checkValid('decrements', decrement, -1)
  }
})
