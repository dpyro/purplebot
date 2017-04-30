import { expect } from 'chai'
import EventEmitter from 'events'
import streamBuffers from 'stream-buffers'

import Cli from '../src/cli'

describe('cli', function () {
  let target, cli, input, output

  beforeEach(function setupConsole () {
    target = new EventEmitter()
    target.commands = new Map()

    input = new streamBuffers.ReadableStreamBuffer()
    output = new streamBuffers.WritableStreamBuffer()

    cli = new Cli(target, input, output)

    expect(cli).to.exist
    expect(input).to.exist
    expect(output).to.exist
  })

  it('runs command callback', function (done) {
    target.commands.set('test', () => { done() })

    input.put('test\n')
    input.put(null)
  })
})
