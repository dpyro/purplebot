import 'babel-polyfill'
import { expect } from 'chai'
import sqlite from 'sqlite3'
import _ from 'lodash'

import PurpleBot, { init } from '../src/bot'
import { MemConfig } from '../src/config'
import DictPlugin from '../plugins/dict'

sqlite.verbose()

describe('plugin: dict', function () {
  let config, bot, plugin
  const nick = 'chameleon'
  const channel = '#test'

  before(function () {
    config = new MemConfig()
    expect(config).to.exist
  })

  beforeEach(async function () {
    bot = await init(config)
    expect(bot).to.be.instanceOf(PurpleBot)

    plugin = bot.getPlugin('dict')
    expect(plugin).to.be.instanceOf(DictPlugin)
  })

  afterEach(async function () {
    await plugin.reset()
  })

  it('entry() [empty]', async function () {
    const result = await plugin.entry('term')
    expect(result).to.not.exist
  })

  it('entries() [empty]', async function () {
    const result = await plugin.entries('term')
    expect(result).to.be.empty
  })

  it('add(), entry()', async function () {
    const entry = {
      key: 'term',
      value: 'test value',
      userName: 'testuser'
    }

    await plugin.add(entry.key, entry.value, entry.userName)

    const result = await plugin.entry('term')
    expect(result).to.include(entry)
  })

  it('add(), entry(user = null)', async function () {
    const entry = {
      key: 'term',
      value: 'test value',
      userId: null
    }

    await plugin.add(entry.key, entry.value, entry.user)

    const result = await plugin.entry('term')
    expect(result).to.include(entry)
  })

  it('add(), entry(), remove()', async function () {
    const entry = {
      key: 'term',
      value: 'test value',
      userName: 'testuser'
    }

    await plugin.add(entry.key, entry.value, entry.userName)

    const result = await plugin.entry('term')
    expect(result).to.include(entry)

    expect(await plugin.remove(entry.key, 1)).to.be.true

    const resultAfter = await plugin.entry('term')
    expect(resultAfter).to.not.exist
  })

  async function testResponse (text, key, value) {
    return new Promise((resolve, reject) => {
      bot.on('dict.respond', (context, name, fromValue) => {
        try {
          expect(context.nick).to.equal(nick)
          expect(context.to).to.equal(channel)
          expect(name).to.equal(key)
          expect(fromValue).to.equal(value)
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

  const tests = {
    'exists?': 'exists',
    'two words?': 'two words',
    'multiple  spaces?': 'multiple  spaces',
    ' padded?  ': 'padded',
    '  three padded words? ': 'three padded words',
    'multiple question marks???': 'multiple question marks'
  }

  for (const [text, key] of _.toPairs(tests)) {
    it(`lookup: "${text}"`, async function () {
      const value = 'this value'
      const user = 'testuser'

      await plugin.add(key, value, user)

      await testResponse(text, key, value)
    })
  }
})
