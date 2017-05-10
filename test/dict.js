import 'babel-polyfill'
import { expect } from 'chai'
import { EventEmitter } from 'events'
import _ from 'lodash'

import Config from '../src/config'
import DictPlugin from '../plugins/dict'

describe('plugin: dict', function () {
  this.timeout(3000)

  let config, emitter, plugin
  const nick = 'chameleon'
  const channel = '#test'

  beforeEach(async function () {
    config = await Config.temp()
    expect(config).to.exist

    emitter = new EventEmitter()
    plugin = new DictPlugin()
    await plugin.load(emitter, config)
    expect(plugin).to.exist
  })

  afterEach(async function () {
    await config.removeDir()
    emitter = null
    plugin = null
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

  function testResponse (text, key, value, done) {
    emitter.on('dict.respond', (fromNick, to, name, fromValue) => {
      try {
        expect(fromNick).to.equal(nick)
        expect(to).to.equal(channel)
        expect(name).to.equal(key)
        expect(fromValue).to.equal(value)
        done()
      } catch (err) {
        done(err)
      }
    })

    emitter.emit('message#', nick, channel, text)
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
    it(`lookup: "${text}"`, function (done) {
      const value = 'this value'
      const user = 'testuser'

      plugin.add(key, value, user)

      testResponse(text, key, value, done)
    })
  }
})
