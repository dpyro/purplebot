const expect = require('chai').expect
const join = require('path').join
const fs = require('fs-extra')
const tmpdir = require('os').tmpdir

const Config = require('../src/config')

let testDir = null

describe('config', function () {
  before('create temp dir', function (done) {
    const tempDirPath = join(tmpdir(), 'purplebot-')
    fs.mkdtemp(tempDirPath, (err, folder) => {
      testDir = folder
      done(err)
    })
  })

  after('delete temp dir', function (done) {
    fs.emptyDir(testDir, () => {
      fs.rmdir(testDir, done)
    })
  })

  function createConfigFile () {
    const testPath = join(testDir, 'test.json')
    const testData = '{ "test": "valid" }'

    fs.writeFileSync(testPath, testData)

    return new Config(testPath)
  }

  it('new', function () {
    const config = createConfigFile()

    expect(config).to.exist
  })

  it('#get', function () {
    const config = createConfigFile()

    expect(config).to.exist

    const value = config.get('test')

    expect(value).to.equal('valid')
  })

  it('#set', function () {
    const config = createConfigFile()

    config.set('test', 'different')
    config.flush()
    config.sync()
    const value = config.get('test')

    expect(value).to.equal('different')
  })
})
