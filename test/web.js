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
      .get('/error')
      .replyWithError('Mocked generic error')
      .get('/valid')
      .twice()
      .replyWithFile(200, path.join(__dirname, '/fixtures/valid.html'))
      .get('/valid4')
      .replyWithFile(200, path.join(__dirname, '/fixtures/valid4.html'))
      .get('/redirect')
      .reply(307, 'Redirected', {'Location': '/valid'})
      .get('/redirect/error')
      .reply(307, 'Redirected', {'Location': '/error'})
      .get('/error')
      .replyWithError('Mocked generic error')
      .get('/image')
      .replyWithFile(200, path.join(__dirname, '/fixtures/pixel.png'), {'Content-Type': 'image/png'})

    expect(scope).to.exist
  })

  beforeEach(function () {
    bot = new PurpleBot()
    expect(bot).to.exist
  })

  after(function () {
    expect(nock.isDone()).to.be.true
  })

  function validateResult (done) {
    bot.on('self', (to, text) => {
      try {
        expect(to).to.equal(channel)
        expect(text.toLowerCase()).to.have.string('valid')
        done()
      } catch (e) {
        done(e)
      }
    })
  }

  function expectNoEvent (bot, event, done, test) {
    let error

    bot.on(event, (nick, to, link) => {
      error = new Error(`Expected no emit for event ${event}`)
    })

    test()

    done(error)
  }

  it('does not emit on invalid link', function (done) {
    expectNoEvent(bot, 'web', done, () => {
      emitUrl('http://:example.local/valid')
    })
  })

  it('title for valid link', function (done) {
    validateResult(done)

    emitUrl('http://example.local/valid')
  })

  it('title for valid link (html4)', function (done) {
    validateResult(done)

    emitUrl('http://example.local/valid4')
  })

  it('ignores erroneous replies', function (done) {
    expectNoEvent(bot, 'self', done, () => {
      emitUrl('http://example.local/error')
    })
  })

  it('follows redirect', function (done) {
    validateResult(done)

    emitUrl('http://example.local/redirect')
  })

  it('ignores erroneous redirect', function (done) {
    expectNoEvent(bot, 'self', done, () => {
      emitUrl('http://example.local/redirect/error')
    })
  })

  it('image', function (done) {
    expectNoEvent(bot, 'self', done, () => {
      emitUrl('http://example.local/image')
    })
  })

  it('ignores timeout')

  it('https', function (done) {
    nock('https://example.local/')
      .get('/valid')
      .replyWithFile(200, path.join(__dirname, '/fixtures/valid.html'))

    validateResult(done)

    emitUrl('https://example.local/valid')
  })

})
