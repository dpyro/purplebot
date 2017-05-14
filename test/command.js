import 'babel-polyfill'
import { expect } from 'chai'

import { init } from '../src/bot'
import { MemConfig } from '../src/config'

describe('command', function () {
  let bot, config
  const channel = '#test'

  before(function () {
    config = new MemConfig()
    config.set('plugins', false)
  })

  beforeEach(async function () {
    bot = await init(config)
    expect(bot).to.exist
  })

  function emitMessage (text) {
    expect(bot.client.emit('message', 'someone', channel, text)).is.true
  }

  async function validateCommandResult (argResults, message) {
    return new Promise((resolve, reject) => {
      bot.on('command', (context, command, ...args) => {
        try {
          expect(context).to.exist
          expect(context.nick).to.exist
          expect(context.to).to.exist
          expect(command).to.equal('test')
          expect(args).to.deep.equal(argResults)
          resolve()
        } catch (err) {
          reject(err)
        }
      })

      emitMessage(message)
    })
  }

  it('emits', function () {
    return validateCommandResult([], '.test')
  })

  it('emits with arg', function () {
    return validateCommandResult(['arg'], '.test arg')
  })

  it('emits trimmed whitespace with arg', function () {
    return validateCommandResult(['arg'], ' .test    arg ')
  })

  async function expectNoEvent (event, message) {
    let error

    bot.on(event, (nick, command, ...args) => {
      error = new Error(`Expected no emit for event ${event}`)
    })

    return new Promise((resolve, reject) => {
      emitMessage(message)

      if (error) {
        reject(error)
      }
      resolve()
    })
  }

  it('ignores empty command', function () {
    return expectNoEvent('command', '.')
  })

  it('ignores ellipses', function () {
    return expectNoEvent('command', '...')
  })

  it('ignores ellipses with whitespace', function () {
    return expectNoEvent('command', ' ...  ')
  })
})
