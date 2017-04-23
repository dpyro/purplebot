const expect = require('chai').expect
const exec = require('child_process').exec

describe('index', function () {
  this.slow(2000)
  this.timeout(3000)

  it('npm start --help', function () {
    return new Promise(function (resolve) {
      exec('npm start -- --help', (error, stdout, stderr) => {
        expect(error).to.not.exist
        expect(stdout + stderr).to.have.a.string('help')
        resolve()
      })
    })
  })
})
