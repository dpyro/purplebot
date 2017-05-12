import { expect } from 'chai'
import { exec } from 'child_process'

describe('index', function () {
  this.slow(4000)
  this.timeout(10000)

  it('npm start --help', function () {
    return new Promise(function (resolve) {
      exec('npm start -- --help', (error, stdout, stderr) => {
        expect(error).to.not.exist
        expect(stdout + stderr).to.have.string('help')
        resolve()
      })
    })
  })
})
