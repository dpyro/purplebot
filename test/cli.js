const expect = require('chai').expect
const EventEmitter = require('events')
const streamBuffers = require('stream-buffers')

const Cli = require('../src/cli')

/**
 *
 *
 * @param {any} done
 * @returns {Cli, stream.Readable, stream.Writeable} Cli, input, output
 */
function setupConsole (done) {
  const target = new EventEmitter()
  target.commands = new Map()

  if (done != null) {
    target.commands.set('test', () => { done() })
  }

  const input = new streamBuffers.ReadableStreamBuffer()
  const output = new streamBuffers.WritableStreamBuffer()

  const cli = new Cli(target, input, output)

  expect(cli).to.exist
  expect(input).to.exist
  expect(output).to.exist

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
