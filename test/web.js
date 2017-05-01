import 'babel-polyfill'
import { expect } from 'chai'
import nock from 'nock'
import path from 'path'

import initBot from '../src/bot'

describe('plugin: web', function () {
  let bot, scope
  const channel = '#test'

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

  beforeEach(async function () {
    bot = await initBot()
    expect(bot).to.exist
  })

  after(function () {
    expect(nock.isDone()).to.be.true
  })

  function emitUrl (link) {
    expect(bot.client.emit('message#', 'someone', channel, link)).is.true
  }

  async function validateResult (test) {
    return new Promise((resolve, reject) => {
      bot.on('self', (target, text) => {
        try {
          expect(target).to.equal(channel)
          expect(text.toLowerCase()).to.have.string('valid title')
          resolve()
        } catch (err) {
          reject(err)
        }
      })

      test()
    })
  }

  async function expectNoEvent (bot, event, test) {
    return new Promise((resolve, reject) => {
      bot.on(event, (nick, to, link) => {
        reject(new Error(`Expected no emit for event ${event}`))
      })

      test()

      resolve()
    })
  }

  it('does not emit on invalid link', function () {
    return expectNoEvent(bot, 'web', () => {
      emitUrl('http://:example.local/valid')
    })
  })

  it('title for valid link', function () {
    return validateResult(() => {
      emitUrl('http://example.local/valid')
    })
  })

  it('title for valid link (html4)', function () {
    return validateResult(() => {
      emitUrl('http://example.local/valid4')
    })
  })

  it('ignores erroneous replies', function () {
    return expectNoEvent(bot, 'self', () => {
      emitUrl('http://example.local/error')
    })
  })

  it('follows redirect', function () {
    return validateResult(() => {
      emitUrl('http://example.local/redirect')
    })
  })

  it('ignores erroneous redirect', function () {
    return expectNoEvent(bot, 'self', () => {
      emitUrl('http://example.local/redirect/error')
    })
  })

  it('image', function () {
    return expectNoEvent(bot, 'self', () => {
      emitUrl('http://example.local/image')
    })
  })

  it('ignores timeout')

  it('https', function () {
    nock('https://example.local/')
      .get('/valid')
      .replyWithFile(200, path.join(__dirname, '/fixtures/valid.html'))

    return validateResult(() => {
      emitUrl('https://example.local/valid')
    })
  })
})
