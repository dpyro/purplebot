const streamBuffers = require('stream-buffers')

const cli = require('../src/cli')

describe('cli', () => {
  it('should run callback', (done) => {
    const commands = new Map()
    commands.set('test', () => { done() })

    const input = new streamBuffers.ReadableStreamBuffer()
    const output = new streamBuffers.WritableStreamBuffer()

    const console = cli(commands, input, output)

    input.put('test\n')
    input.put(null)

    return console
  })
})
