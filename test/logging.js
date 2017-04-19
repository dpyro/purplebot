const EventEmitter = require('events')
const expect = require('chai').expect
const streamBuffers = require('stream-buffers')
const _ = require('lodash')

const logging = require('../plugins/logging')

function setupLogging () {
  const emitter = new EventEmitter()
  const output = new streamBuffers.WritableStreamBuffer()

  logging(emitter, output)

  return [emitter, output]
}

/**
 * @returns {Map<string, Array<string>>}
 */
function eventTests () {
  const channel = '#test'
  const nick = 'SomeNick'
  const selfNick = 'selfNick'
  const text = 'This is a message'

  const map = new Map()

  map.set('action', [nick, selfNick, text])
  map.set('ctcp-notice', [nick, selfNick, text])
  map.set('ctcp-privmsg', [nick, selfNick, text])
  map.set('ctcp-version', [nick, selfNick])
  map.set('invite', [channel, nick])
  map.set('join', [channel, nick])
  map.set('kick', [channel, nick, selfNick, text])
  map.set('kill', [nick, text, [channel]])
  map.set('msg', [nick, channel, text])
  map.set('+mode', [channel, nick, 'k', text])
  map.set('-mode', [channel, nick, 'k', text])

  const names = { 'Q': '@', nick: '' }
  map.set('names', [channel, names])
  map.set('notice', [nick, selfNick, text])
  map.set('pm', [nick, text])
  map.set('quit', [nick, text])
  map.set('part', [channel, nick, text])
  map.set('registered', null)
  map.set('selfMessage', [nick, text])
  map.set('topic', [channel, 'the new topic', nick])

  const info = {
    'nick': nick,
    'user': 'username',
    'host': 'hostname',
    'realname': 'Mr. No-one',
    'channels': [channel, '@#test2'],
    'server': 'irc.example.com',
    'serverinfo': 'An example IRC server',
    'operator': 'is an IRC Operator'
  }
  map.set('whois', [info])

  return map
}

describe('logging', function () {
  it('attaches logging', function () {
    const [emitter] = setupLogging()

    expect(emitter.eventNames()).to.not.be.empty
  })

  eventTests().forEach(function (args, eventName) {
    it(`outputs data on ${eventName}`, function () {
      const [emitter, output] = setupLogging()

      expect(output.size()).to.equal(0)

      const safeArgs = args || []
      emitter.emit(eventName, ...safeArgs)

      expect(output.size()).to.above(0)

      const line = output.getContentsAsString()

      _.flatMapDeep(safeArgs, (arg) => {
        return (typeof arg !== 'string') ? _.values(arg) : arg
      }).forEach((arg) => {
        expect(line).to.have.string(arg)
      })
    })
  }, this)
})
