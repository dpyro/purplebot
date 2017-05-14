import 'babel-polyfill'
import { expect } from 'chai'
import nock from 'nock'
import { join } from 'path'

import { init } from '../src/bot'
import { FileConfig } from '../src/config'

describe('plugin: web', function () {
  let bot, scope, config
  const channel = '#test'

  before(async function () {
    scope = nock('http://example.local/')
      .get('/error')
      .replyWithError('Mocked generic error')
      .get('/valid')
      .twice()
      .replyWithFile(200, join(__dirname, '/fixtures/valid.html'))
      .get('/valid4')
      .replyWithFile(200, join(__dirname, '/fixtures/valid4.html'))
      .get('/redirect')
      .reply(307, 'Redirected', {'Location': '/valid'})
      .get('/redirect/error')
      .reply(307, 'Redirected', {'Location': '/error'})
      .get('/error')
      .replyWithError('Mocked generic error')
      .get('/image')
      .replyWithFile(200, join(__dirname, '/fixtures/pixel.png'), {'Content-Type': 'image/png'})
    expect(scope).to.exist

    config = await FileConfig.temp()
    expect(config).to.exist
  })

  beforeEach(async function () {
    bot = await init(config)
    expect(bot).to.exist
  })

  after(async function () {
    await config.removeDir()
    expect(nock.isDone()).to.be.true
  })

  function emitUrl (link) {
    expect(bot.client.emit('message#', 'someone', channel, link)).is.true
  }

  async function validateUrlResult (url) {
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

      emitUrl(url)
    })
  }

  async function expectNoUrlEvent (event, url) {
    return new Promise((resolve, reject) => {
      bot.on(event, (nick, to, link) => {
        reject(new Error(`Expected no emit for event ${event}`))
      })

      emitUrl(url)

      resolve()
    })
  }

  it('does not emit on invalid link', function () {
    return expectNoUrlEvent('web.link', 'http://:example.local/valid')
  })

  it('title for valid link', function () {
    return validateUrlResult('http://example.local/valid')
  })

  it('title for valid link (html4)', function () {
    return validateUrlResult('http://example.local/valid4')
  })

  it('ignores erroneous replies', function () {
    return expectNoUrlEvent('self', 'http://example.local/error')
  })

  it('follows redirect', function () {
    return validateUrlResult('http://example.local/redirect')
  })

  it('ignores erroneous redirect', function () {
    return expectNoUrlEvent('self', 'http://example.local/redirect/error')
  })

  it('image', function () {
    return expectNoUrlEvent('self', 'http://example.local/image')
  })

  it('ignores timeout')

  it('https', function () {
    nock('https://example.local/')
      .get('/valid')
      .replyWithFile(200, join(__dirname, '/fixtures/valid.html'))

    return validateUrlResult('https://example.local/valid')
  })
})
