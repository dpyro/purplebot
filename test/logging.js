const assert = require('assert')
const EventEmitter = require('events')
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
  const map = new Map()

  map.set('invite', ['#test', 'someNick'])
  map.set('registered', null)

  return map
}

describe('logging', function () {
  it('attaches logging', function () {
    const [emitter] = setupLogging()

    assert(emitter.eventNames().length > 0)
  })

  eventTests().forEach(function (args, eventName) {
    it(`outputs important data on ${eventName}`, function () {
      const [emitter, output] = setupLogging()

      assert(output.size() === 0)

      const safeArgs = args || []
      emitter.emit(eventName, ...safeArgs)

      assert(output.size() > 0)

      const line = output.getContentsAsString()

      assert(line.toLowerCase().includes(eventName.toLowerCase()))

      for (const arg of safeArgs) {
        assert(line.includes(arg))
      }
    })
  }, this)
})
