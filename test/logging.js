import EventEmitter from 'events'
import { expect } from 'chai'
import streamBuffers from 'stream-buffers'
import _ from 'lodash'

import LoggingPlugin from '../plugins/logging'

/**
 * @returns {Array<Array<string>>}
 */
function eventTests () {
  const server = 'example.com'
  const channel = '#test'
  const nick = 'SomeNick'
  const selfNick = 'selfNick'
  const text = 'This is a message'

  const emits = [
    ['connect', server],
    ['disconnect', server],
    ['disconnect', server, text],
    ['action', nick, selfNick, text],
    ['ctcp-notice', nick, selfNick, text],
    ['ctcp-privmsg', nick, selfNick, text],
    ['ctcp-version', nick, selfNick],
    ['invite', channel, nick],
    ['join', channel, nick],
    ['kick', channel, nick, selfNick, text],
    ['kill', nick, text, [channel, `${channel}2`]],
    ['msg', nick, channel, text],
    ['+mode', channel, nick, 'm'],
    ['+mode', channel, nick, 'k', text],
    ['-mode', channel, nick, 'm'],
    ['-mode', channel, nick, 'k', text],
    ['names', channel, { 'Q': '@', nick: '' }],
    ['nick', nick, 'NewNick', [channel]],
    ['notice', selfNick, text],
    ['notice', nick, selfNick, text],
    ['pm', nick, text],
    ['quit', nick, text],
    ['part', channel, nick, text],
    ['registered'],
    ['selfMessage', nick, text],
    ['topic', channel, 'the new topic', nick],
    ['whois', {
      'nick': nick,
      'user': 'username',
      'host': 'hostname',
      'realname': 'Mr. No-one',
      'channels': [channel, '@#test2'],
      'server': 'irc.example.com',
      'serverinfo': 'An example IRC server',
      'operator': 'is an IRC Operator'
    }]
  ]

  return emits
}

describe('plugin: logging', function () {
  let logger, emitter, output

  beforeEach(function () {
    emitter = new EventEmitter()
    output = new streamBuffers.WritableStreamBuffer()
    logger = new LoggingPlugin(emitter, output)

    expect(logger).to.exist
  })

  const tests = eventTests()
  for (const [event, ...args] of tests) {
    it(`outputs on ${event}: ${(args && args.length) || 0}`, function () {
      expect(output.size()).to.equal(0)
      emitter.emit(event, ...args)

      expect(output.size()).to.above(0)
      const line = output.getContentsAsString()

      _.flatMapDeep(args, (arg) => {
        return (typeof arg !== 'string') ? _.values(arg) : arg
      }).forEach((arg) => {
        expect(line).to.have.string(arg)
      })
    })
  }
})
