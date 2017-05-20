import 'babel-polyfill'
import { expect } from 'chai'
import fs from 'fs-extra'

import { FileConfig } from '../src/config'

describe('config', function () {
  let config

  beforeEach(async function createConfig () {
    config = await FileConfig.temp()
    expect(config).to.be.exist
    expect(await config.get('test')).to.not.exist
  })

  afterEach(async function deleteConfigDir () {
    await config.removeDir()
    expect(() => fs.access(config.configDirPath)).to.throw
  })

  it('ensureDir(), hasDir()', async function () {
    await config.ensureDir()
    expect(() => fs.access(config.configDirPath)).to.not.throw
    expect(await config.hasDir()).to.be.true
  })

  it('load()', async function () {
    const testData = '{ "test": "valid" }'
    await fs.writeFile(config.configFilePath, testData)
    await config.load()
    const value = await config.get('test')
    expect(value).to.equal('valid')
  })

  it('save()', async function () {
    await config.set('test', 'different')
    await config.save()
    await config.load()
    const value = await config.get('test')

    expect(value).to.equal('different')
  })
})
