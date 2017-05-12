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
import { FileConfig } from './config'

if (require.main === module) {
  const config = FileConfig.automatic()

  if (yargs.argv.help) {
    yargs.showHelp()
    process.exit(0)
  }

  launchBot(config)
}

async function launchBot (options) {
  const bot = await init(options)
  const cli = new Cli(bot)
  await bot.connect()
  return cli
}
