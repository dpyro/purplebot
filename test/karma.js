import 'babel-polyfill'
import { expect } from 'chai'

import { FileConfig } from '../src/config'
import PurpleBot, { init } from '../src/bot'
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
    expect(bot).to.be.instanceOf(PurpleBot)
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

  async function checkValid (message, term, result) {
    return new Promise((resolve, reject) => {
      bot.on('karma.respond', (fromNick, to, term, karma) => {
        try {
          expect(fromNick).to.equal(nick)
          expect(to).to.equal(channel)
          expect(term).to.equal(term)
          expect(karma).to.equal(result)

          resolve()
        } catch (err) {
          reject(err)
        }
      })

      bot.on('self', (to, text) => {
        try {
          expect(to).to.equal(channel)
          expect(text).to.contain(term)

          resolve()
        } catch (err) {
          reject(err)
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
    it(`increments: "${message}"`, async function () {
      await checkValid(message, term, 1)
    })
  }

  it(`increments: "test++99"`, async function () {
    await checkValid('test++9', 'test', 99)
  })

  it(`increments: "test++++"`, async function () {
    await checkValid('test++++', 'test', 3)
  })

  const decrements = [
    ['test--', 'test'],
    [' test--', 'test'],
    ['test-- ', 'test'],
    ['another test--', 'another test']
  ]
  for (const [message, term] of decrements) {
    it(`decrements: "${message}"`, async function () {
      await checkValid(message, term, -1)
    })
  }

  it('decrements: "test--99"', async function () {
    await checkValid('test--9', 'test', -99)
  })

  it('decrements: "test----"', async function () {
    await checkValid('test----', 'test', -3)
  })
})
