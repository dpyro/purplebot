import 'babel-polyfill'
import { expect } from 'chai'
import sqlite from 'sqlite3'

import { MemConfig } from '../src/config'
import PurpleBot, { init } from '../src/bot'
import KarmaPlugin from '../plugins/karma'

sqlite.verbose()

describe('plugin: karma', async function () {
  const nick = 'chameleon'
  const channel = '#test'
  let bot, plugin, config

  before(function () {
    config = new MemConfig()
  })

  // TODO: use custom test config
  beforeEach(async function () {
    bot = await init(config)
    expect(bot).to.be.instanceOf(PurpleBot)

    plugin = bot.getPlugin('karma')
    expect(plugin).to.be.instanceOf(KarmaPlugin)

    const output = await plugin.top()
    expect(output).to.be.empty
  })

  it('top() [empty]', async function () {
    const results = await plugin.top()
    expect(results).to.be.empty
  })

  it('get() [empty]', async function () {
    const result = await plugin.get('term')
    expect(result).to.not.exist
  })

  async function checkValid (text, term, result) {
    return new Promise((resolve, reject) => {
      bot.on('self', (to, text) => {
        try {
          expect(to).to.equal(channel)
          expect(text).to.contain(term)

          resolve()
        } catch (err) {
          reject(err)
        }
      })

      const user = 'testuser'
      const host = 'testhost'
      const message = { nick, user, host }
      bot.emit('message#', nick, channel, text, message)
    })
  }

  const increments = [
    ['test++', 'test'],
    [' test++', 'test'],
    ['test++ ', 'test'],
    ['this test++', 'this test']
  ]
  for (const [text, term] of increments) {
    it(`increments: "${text}"`, async function () {
      await checkValid(text, term, 1)
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
  for (const [text, term] of decrements) {
    it(`decrements: "${text}"`, async function () {
      await checkValid(text, term, -1)
    })
  }

  it('decrements: "test--99"', async function () {
    await checkValid('test--9', 'test', -99)
  })

  it('decrements: "test----"', async function () {
    await checkValid('test----', 'test', -3)
  })

  it('.karma info')

  it('.karma set')

  it('.karma clear')
})
