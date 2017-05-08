#!/usr/bin/env node

/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

/**
 * The purpleist module.
 *
 * @module purplebot
 */

import * as yargs from 'yargs'

import { init } from './bot'
import Cli from './cli'

if (require.main === module) {
  yargs.usage('Usage: $0 [-s server.address:port] [-c #channel1 #channel2 ...]')
    .options('c', {
      alias: 'channels',
      default: [],
      describe: 'channels to join upon connect',
      type: 'array'
    })
    .option('s', {
      alias: 'server',
      default: 'localhost',
      describe: 'connect to this server',
      nargs: 1,
      type: 'string'
    })
    .option('v', {
      alias: 'verbose',
      describe: 'Print debugging output',
      type: 'boolean'
    })
    .help()
  const argv = yargs.argv

  if (argv.help) {
    yargs.showHelp()
    process.exit(0)
  }

  const options = {
    server: argv.server,
    channels: argv.channels,
    debug: argv.v
  }

  launchBot(options)
}

async function launchBot (options) {
  const bot = await init(options)
  const cli = new Cli(bot)
  await bot.connect()
  return cli
}
