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

  async function validateCommandResult (argResults, test) {
    let error

    bot.on('command', (context, command, ...args) => {
      try {
        expect(context).to.exist
        expect(context.nick).to.exist
        expect(context.to).to.exist
        expect(command).to.equal('test')
        expect(args).to.deep.equal(argResults)
      } catch (err) {
        error = err
      }
    })

    return new Promise((resolve, reject) => {
      test()

      if (error) {
        return reject(error)
      }
      return resolve()
    })
  }

  it('emits', function () {
    return validateCommandResult([], () => {
      emitMessage('.test')
    })
  })

  it('emits with arg', function () {
    return validateCommandResult(['arg'], () => {
      emitMessage('.test arg')
    })
  })

  it('emits trimmed whitespace with arg', function () {
    return validateCommandResult(['arg'], () => {
      emitMessage(' .test    arg ')
    })
  })

  async function expectNoEvent (bot, event, test) {
    let error

    bot.on(event, (nick, command, ...args) => {
      error = new Error(`Expected no emit for event ${event}`)
    })

    return new Promise((resolve, reject) => {
      test()

      if (error) {
        return reject(error)
      }
      return resolve()
    })
  }

  it('ignores empty command', function () {
    return expectNoEvent(bot, 'command', () => {
      emitMessage('.')
    })
  })

  it('ignores ellipses', function () {
    return expectNoEvent(bot, 'command', () => {
      emitMessage('...')
    })
  })

  it('ignores ellipses with whitespace', function () {
    return expectNoEvent(bot, 'command', () => {
      emitMessage(' ...  ')
    })
  })
})
