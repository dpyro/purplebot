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

  it('emits', function (done) {
    let error

    bot.on('command', (nick, command, ...args) => {
      try {
        expect(nick).to.exist
        expect(command).to.equal('test')
        expect(args).to.be.empty
      } catch (err) {
        error = err
      }
    })

    emitMessage('.test')

    done(error)
  })

  it('emits with arg', function (done) {
    let error

    bot.on('command', (nick, command, ...args) => {
      try {
        expect(nick).to.exist
        expect(command).to.equal('test')
        expect(args).to.have.members(['arg'])
      } catch (err) {
        error = err
      }
    })

    emitMessage('.test arg')

    done(error)
  })

  it('emits trimmed whitespace with arg', function (done) {
    let error

    bot.on('command', (nick, command, ...args) => {
      try {
        expect(nick).to.exist
        expect(command).to.equal('test')
        expect(args).to.have.members(['arg'])
      } catch (err) {
        error = err
      }
    })

    emitMessage(' .test    arg ')

    done(error)
  })

  it('ignore ellipses', function (done) {
    let error

    bot.on('command', (nick, command, ...args) => {
      error = new Error('Expected no emit for event command')
    })

    emitMessage('...')

    done(error)
  })

  it('ignore ellipses with whitespace', function (done) {
    let error

    bot.on('command', (nick, command, ...args) => {
      error = new Error('Expected no emit for event command')
    })

    emitMessage(' ...  ')

    done(error)
  })
})
