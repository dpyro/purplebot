const streamBuffers = require('stream-buffers')

const Cli = require('../src/cli')

function setupConsole (done) {
  const commands = new Map()
  commands.set('test', () => { done() })

  const input = new streamBuffers.ReadableStreamBuffer()
  const output = new streamBuffers.WritableStreamBuffer()

  const cli = new Cli(input, output)
  cli.setCommands(commands)

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
