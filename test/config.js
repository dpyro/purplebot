import 'babel-polyfill'
import { expect } from 'chai'
import fs from 'fs-extra'

import Config from '../src/config'

describe('config', function () {
  let config

  beforeEach(async function createConfig () {
    config = await Config.temp()
    expect(config).to.be.instanceof(Config)

    await config.ensureDir()
    expect(() => fs.access(config.configDir)).to.not.throw
    expect(await config.hasDir()).to.be.true

    const testData = '{ "test": "valid" }'
    await fs.writeFile(config.configPath, testData)

    expect(config.get()).to.be.empty

    await config.sync()
    expect(config.get()).to.not.be.empty
  })

  afterEach(async function deleteConfigDir () {
    await config.removeDir()
    expect(() => fs.access(config.configDir)).to.throw
  })

  it('get()', function () {
    const value = config.get('test')
    expect(value).to.equal('valid')
  })

  it('set()', async function () {
    config.set('test', 'different')
    await config.flush()
    await config.sync()
    const value = config.get('test')

    expect(value).to.equal('different')
  })
})
