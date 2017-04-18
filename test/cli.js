const EventEmitter = require('events')
const streamBuffers = require('stream-buffers')

const Cli = require('../src/cli')

function setupConsole (done) {
  const target = new EventEmitter()
  target.commands = new Map()
  target.commands.set('test', () => { done() })

  const input = new streamBuffers.ReadableStreamBuffer()
  const output = new streamBuffers.WritableStreamBuffer()

  const cli = new Cli(target, input, output)

  return [cli, input, output]
}

describe('cli', function () {
  it('runs command callback', function (done) {
    const [cli, input] = setupConsole(done)

    input.put('test\n')
    input.put(null)

    return cli
  })
})
