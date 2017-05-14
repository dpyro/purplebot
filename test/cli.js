import { expect } from 'chai'
import streamBuffers from 'stream-buffers'

import { init } from '../src/bot'
import Cli from '../src/cli'
import { MemConfig } from '../src/config'

describe('cli', function () {
  let bot, config, cli, input, output

  before(function () {
    config = new MemConfig()
    config.set('plugins', false)
  })

  beforeEach(async function setupConsole () {
    bot = await init(config)
    expect(bot).to.exist

    input = new streamBuffers.ReadableStreamBuffer()
    output = new streamBuffers.WritableStreamBuffer()
    cli = new Cli(bot, input, output)

    expect(input).to.exist
    expect(output).to.exist
    expect(cli).to.exist
  })

  it('runs command callback', function (done) {
    bot.commands['test'] = () => done()

    input.put('test\n')
    input.put(null)
  })
})
