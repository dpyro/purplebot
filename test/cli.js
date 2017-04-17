const streamBuffers = require('stream-buffers')

const cli = require('../src/cli')

function setupConsole (done) {
  const commands = new Map()
  commands.set('test', () => { done() })

  const input = new streamBuffers.ReadableStreamBuffer()
  const output = new streamBuffers.WritableStreamBuffer()

  const console = cli(commands, input, output)

  return [console, input, output]
}

describe('cli', function () {
  it('runs command callback', function (done) {
    const [console, input] = setupConsole(done)

    input.put('test\n')
    input.put(null)

    return console
  })
})
