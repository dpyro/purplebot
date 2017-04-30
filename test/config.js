import { expect } from 'chai'
import { join } from 'path'
import fs from 'fs-extra'
import { tmpdir } from 'os'

import Config from '../src/config'

describe('config', function () {
  let testDir, config

  before('create temp dir', function (done) {
    const tempDirPath = join(tmpdir(), 'purplebot-')
    fs.mkdtemp(tempDirPath, (err, folder) => {
      testDir = folder
      done(err)
    })
  })

  beforeEach(function createConfigFile () {
    const testPath = join(testDir, 'test.json')
    const testData = '{ "test": "valid" }'

    fs.writeFileSync(testPath, testData)

    config = new Config(testPath)
    expect(config).to.exist
  })

  after('delete temp dir', function (done) {
    fs.emptyDir(testDir, () => {
      fs.rmdir(testDir, done)
    })
  })

  it('new', function () {})

  it('#get', function () {
    const value = config.get('test')

    expect(value).to.equal('valid')
  })

  it('#set', function () {
    config.set('test', 'different')
    config.flush()
    config.sync()
    const value = config.get('test')

    expect(value).to.equal('different')
  })
})
