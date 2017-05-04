import 'babel-polyfill'
import { expect } from 'chai'
import EventEmitter from 'events'

import Config from '../src/config'
import initDict from '../plugins/dict'

describe('plugin: dict', function () {
  let config, emitter, plugin

  beforeEach(async function () {
    config = await Config.temp()
    expect(config).to.exist

    emitter = new EventEmitter()
    plugin = await initDict(emitter, config)
    expect(plugin).to.exist
  })

  afterEach(async function () {
    await config.removeDir()
    emitter = null
    plugin = null
  })

  it('definition() [empty]', async function () {
    const result = await plugin.definition('term')
    expect(result).to.not.exist
  })

  it('definitions() [empty]', async function () {
    const result = await plugin.definition('term')
    expect(result).to.be.empty
  })

  it('add(), definition()', async function () {
    const definition = {
      key: 'term',
      value: 'test value',
      user: 'testuser'
    }

    await plugin.add(definition.key, definition.value, definition.user)

    const result = await plugin.definition('term')
    expect(result).to.include(definition)
  })

  it('add(), definition(user = null)', async function () {
    const definition = {
      key: 'term',
      value: 'test value',
      user: null
    }

    await plugin.add(definition.key, definition.value, definition.user)

    const result = await plugin.definition('term')
    expect(result).to.include(definition)
  })
})
