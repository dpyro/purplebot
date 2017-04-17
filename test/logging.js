const EventEmitter = require('events')
const expect = require('chai').expect
const streamBuffers = require('stream-buffers')

const logging = require('../src/logging')

function setupLogging () {
  const emitter = new EventEmitter()
  const output = new streamBuffers.WritableStreamBuffer()

  logging(emitter, output)

  return [emitter, output]
}

/**
 * @returns {Map<string, any>}
 */
function eventTests () {
  const channel = '#test'
  const nick = 'SomeNick'

  const map = new Map()

  map.set('invite', [channel, nick])
  // map.set('pm', [nick])
  map.set('registered', null)
  map.set('topic', [channel, 'the new topic', nick])

  return map
}

describe('logging', function () {
  it('attaches logging', function () {
    const [emitter] = setupLogging()

    expect(emitter.eventNames()).to.not.be.empty
  })

  eventTests().forEach(function (args, eventName) {
    it(`outputs important data on ${eventName}`, function () {
      const [emitter, output] = setupLogging()

      expect(output.size()).to.equal(0)

      const safeArgs = args || []
      emitter.emit(eventName, ...safeArgs)

      expect(output.size()).to.above(0)

      const line = output.getContentsAsString()

      expect(line.toLowerCase()).to.include(eventName.toLowerCase())

      for (const arg of safeArgs) {
        expect(line).to.include(arg)
      }
    })
  }, this)
})
