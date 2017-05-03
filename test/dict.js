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

  it('empty', function () {

  })
})
