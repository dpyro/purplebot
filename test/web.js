const expect = require('chai').expect
const nock = require('nock')
const path = require('path')

const PurpleBot = require('../src/bot')

describe('plugin: web', function () {
  let bot, scope
  const channel = '#test'

  function emitUrl (link) {
    expect(bot.client.emit('message#', 'someone', channel, link)).is.true
  }

  before(function () {
    scope = nock('http://example.local/')
              .get('/valid')
              .twice()
              .replyWithFile(200, path.join(__dirname, '/fixtures/valid.html'))
              .get('/error')
              .replyWithError('Mocked generic error')
              .get('/redirect')
              .reply(307, 'Redirected', {'Location': '/valid'})
              .get('/redirect/error')
              .reply(307, 'Redirected', {'Location': '/error'})

    expect(scope).to.exist
  })

  beforeEach(function () {
    bot = new PurpleBot()
    expect(bot).to.exist
  })

  after(function () {
    expect(scope.isDone()).to.be.true
  })

  function validateResult (done) {
    bot.on('self', (to, text) => {
      try {
        expect(to).to.equal(channel)
        expect(text.toLowerCase()).to.have.string('valid html title')
        done()
      } catch (e) {
        done(e)
      }
    })
  }

  function validateNoResult () {
    bot.on('self', (to, text, message) => {
      throw new Error(`Expected no emit for event self: ${text}`)
    })
  }

  it('obtains title for valid link', function (done) {
    validateResult(done)

    emitUrl('http://example.local/valid')
  })

  it('does not emit on invalid link', function () {
    bot.on('web', (nick, to, link) => {
      throw new Error(`Expected no emit for event web: ${link}`)
    })

    emitUrl('http://:example.local/valid')
  })

  it('ignores erroneous replies', function () {
    validateNoResult()

    emitUrl('http://example.local/error')
  })

  it('follows redirect', function (done) {
    validateResult(done)

    emitUrl('http://example.local/redirect')
  })

  it('ignores erroneous redirect', function () {
    validateNoResult()

    emitUrl('http://example.local/redirect/error')
  })
})
