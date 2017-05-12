import 'babel-polyfill'
import { expect } from 'chai'
import { EventEmitter } from 'events'
import _ from 'lodash'

import { FileConfig } from '../src/config'
import DictPlugin from '../plugins/dict'

describe('plugin: dict', function () {
  this.timeout(3000)

  let config, emitter, plugin
  const nick = 'chameleon'
  const channel = '#test'

  before(async function () {
    config = await FileConfig.temp()
    expect(config).to.exist
  })

  beforeEach(async function () {
    emitter = new EventEmitter()
    plugin = new DictPlugin()
    await plugin.load(emitter, config)
    expect(plugin).to.exist
  })

  afterEach(async function () {
    await plugin.reset()
    plugin = null
    emitter = null
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
    const p = new Promise((resolve, reject) => {
      emitter.on('dict.respond', (fromNick, to, name, fromValue) => {
        try {
          expect(fromNick).to.equal(nick)
          expect(to).to.equal(channel)
          expect(name).to.equal(key)
          expect(fromValue).to.equal(value)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })

    emitter.emit('message#', nick, channel, text)

    return p
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
