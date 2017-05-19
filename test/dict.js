import 'babel-polyfill'
import { expect } from 'chai'
import sqlite from 'sqlite3'
import _ from 'lodash'

import PurpleBot, { init } from '../src/bot'
import { FileConfig } from '../src/config'
import DictPlugin from '../plugins/dict'

sqlite.verbose()

describe('plugin: dict', function () {
  this.timeout(3000)

  let config, bot, plugin
  const nick = 'chameleon'
  const channel = '#test'

  before(async function () {
    config = await FileConfig.temp()
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
    bot = null
  })

  after(async function () {
    config.removeDir()
  })

  it('value() [empty]', async function () {
    const result = await plugin.value('term')
    expect(result).to.not.exist
  })

  it('values() [empty]', async function () {
    const result = await plugin.value('term')
    expect(result).to.be.empty
  })

  it('add(), value()', async function () {
    const value = {
      key: 'term',
      value: 'test value',
      user: 'testuser'
    }

    await plugin.add(value.key, value.value, value.user)

    const result = await plugin.value('term')
    expect(result).to.include(value)
  })

  it('add(), value(user = null)', async function () {
    const value = {
      key: 'term',
      value: 'test value',
      user: null
    }

    await plugin.add(value.key, value.value, value.user)

    const result = await plugin.value('term')
    expect(result).to.include(value)
  })

  it('add(), value(), remove()', async function () {
    const value = {
      key: 'term',
      value: 'test value',
      user: 'testuser'
    }

    await plugin.add(value.key, value.value, value.user)

    const result = await plugin.value('term')
    expect(result).to.include(value)

    expect(await plugin.remove(value.key, 1)).to.be.true

    const resultAfter = await plugin.value('term')
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

      bot.emit('message#', nick, channel, text)
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
