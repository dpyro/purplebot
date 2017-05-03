import 'babel-polyfill'
import { expect } from 'chai'
import path from 'path'
import fs from 'fs-extra'
import { tmpdir } from 'os'

import Config from '../src/config'

describe('config', function () {
  function tempConfigDir () {
    const tempPrefix = path.join(tmpdir(), 'purplebot-')
    const tempDirPath = fs.mkdtempSync(tempPrefix)
    return tempDirPath
  }

  let tempDirPath, config

  beforeEach(async function createConfig () {
    tempDirPath = tempConfigDir()

    config = new Config(tempDirPath)
    expect(config).to.exist
    expect(() => fs.accessSync(tempDirPath)).to.throw

    await config.ensureDir()
    expect(fs.accessSync(tempDirPath)).to.not.throw

    const testData = '{ "test": "valid" }'
    fs.writeFileSync(config.configPath, testData)

    await config.sync()
  })

  afterEach(async function deleteConfigDir () {
    await config.removeDir()
    expect(fs.accessSync(tempDirPath)).to.throw
  })

  it('new', function () {

  })

  it('get', function () {
    const value = config.get('test')

    expect(value).to.equal('valid')
  })

  it('set', async function () {
    config.set('test', 'different')
    await config.flush()
    await config.sync()
    const value = config.get('test')

    expect(value).to.equal('different')
  })
})
