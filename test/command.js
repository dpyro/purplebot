const expect = require('chai').expect

const PurpleBot = require('../src/bot')

describe('command', function () {
  let bot
  const channel = '#test'

  beforeEach(function () {
    bot = new PurpleBot()
    expect(bot).to.exist
  })

  function emitMessage (text) {
    expect(bot.client.emit('message', 'someone', channel, text)).is.true
  }

  function validateCommandResult (done, argResults, test) {
    let error

    bot.on('command', (nick, command, ...args) => {
      try {
        expect(nick).to.exist
        expect(command).to.equal('test')
        expect(args).to.deep.equal(argResults)
      } catch (err) {
        error = err
      }
    })

    test()

    done(error)
  }

  it('emits', function (done) {
    validateCommandResult(done, [], () => {
      emitMessage('.test')
    })
  })

  it('emits with arg', function (done) {
    validateCommandResult(done, ['arg'], () => {
      emitMessage('.test arg')
    })
  })

  it('emits trimmed whitespace with arg', function (done) {
    validateCommandResult(done, ['arg'], () => {
      emitMessage(' .test    arg ')
    })
  })

  function expectNoEvent (bot, event, done, test) {
    let error

    bot.on(event, (nick, command, ...args) => {
      error = new Error(`Expected no emit for event ${event}`)
    })

    test()

    done(error)
  }

  it('ignores empty command', function (done) {
    expectNoEvent(bot, 'command', done, () => {
      emitMessage('.')
    })
  })

  it('ignores ellipses', function (done) {
    expectNoEvent(bot, 'command', done, () => {
      emitMessage('...')
    })
  })

  it('ignores ellipses with whitespace', function (done) {
    expectNoEvent(bot, 'command', done, () => {
      emitMessage(' ...  ')
    })
  })
})
