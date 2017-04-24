const expect = require('chai').expect
const nock = require('nock')
const path = require('path')

const PurpleBot = require('../src/bot')

describe('plugin: url', function () {
  let bot, scope
  const channel = '#test'

  function emitUrl (url) {
    expect(bot.client.emit('message#', 'someone', channel, url)).is.true
  }

  beforeEach(function () {
    scope = nock('http://example.local/')
              .get('/valid')
              .replyWithFile(200, path.join(__dirname, '/fixtures/valid.html'))
              .get('/error')
              .replyWithError('Something terrible happened!')
    expect(scope).to.exist

    bot = new PurpleBot()
    expect(bot).to.exist
  })

  it('emits on valid url', function (done) {
    bot.on('url', () => { done() })

    emitUrl('http://example.local/valid')
  })

  it('does not emit on invalid url', function (done) {
    let error = false
    bot.on('url', () => { error = true })

    emitUrl('http://:example.local/')

    if (error) {
      done(new Error())
    } else {
      done()
    }
  })

  it('obtains title for url', function (done) {
    bot.on('self', (to, text) => {
      try {
        expect(to).to.equal(channel)
        expect(text.toLowerCase()).to.have.string('valid html title')
        done()
      } catch (e) {
        done(e)
      }
    })

    emitUrl('http://example.local/valid')
  })
})
