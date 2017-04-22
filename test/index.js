const expect = require('chai').expect
const exec = require('child_process').exec

describe('index', function () {
  it('npm start --help', function () {
    this.slow(4000)

    return new Promise(function (resolve) {
      exec('npm start -- --help', (error, stdout, stderr) => {
        expect(error).to.not.exist
        expect(stdout + stderr).to.have.a.string('help')
        resolve()
      })
    })
  })
})
