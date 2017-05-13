import 'babel-polyfill'
import { expect } from 'chai'

import { FileConfig } from '../src/config'
import { init } from '../src/bot'
import KarmaPlugin from '../plugins/karma'

describe('plugin: karma', async function () {
  this.timeout(4000)

  const nick = 'chameleon'
  const channel = '#test'
  let bot, plugin, config

  before(async function () {
    config = await FileConfig.temp()
  })

  // TODO: use custom test config
  beforeEach(async function () {
    bot = await init(config)
    plugin = bot.getPlugin('karma')
    expect(plugin).to.exist
    expect(plugin).to.be.instanceOf(KarmaPlugin)

    const output = await plugin.top()
    expect(output).to.be.empty
  })

  afterEach(async function () {
    await plugin.reset()
    plugin = null
    bot = null
  })

  after(async function () {
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

  function checkValid (name, message, term, result) {
    it(`${name}: "${message}"`, function (done) {
      let toCheck = 2

      bot.on('karma.respond', (fromNick, to, term, karma) => {
        try {
          expect(fromNick).to.equal(nick)
          expect(to).to.equal(channel)
          expect(term).to.equal(term)
          expect(karma).to.equal(result)

          toCheck--
          if (toCheck === 0) {
            done()
          }
        } catch (error) {
          done(error)
        }
      })

      bot.on('self', (to, text) => {
        try {
          expect(to).to.equal(channel)
          expect(text).to.contain(term)

          toCheck--
          if (toCheck === 0) {
            done()
          }
        } catch (err) {
          done(err)
        }
      })

      bot.emit('message#', nick, channel, message)
    })
  }

  const increments = [
    ['test++', 'test'],
    [' test++', 'test'],
    ['test++ ', 'test'],
    ['this test++', 'this test']
  ]
  for (const [message, term] of increments) {
    checkValid('increments', message, term, 1)
  }

  const decrements = [
    ['test--', 'test'],
    [' test--', 'test'],
    ['test-- ', 'test'],
    ['another test--', 'another test']
  ]
  for (const [message, term] of decrements) {
    checkValid('decrements', message, term, -1)
  }
})
