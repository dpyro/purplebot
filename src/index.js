#!/usr/bin/env node

const PurpleBot = require('./bot.js')
const Cli = require('./cli')

if (require.main === module) {
  const yargs = require('yargs')
    .usage('Usage: $0 [-s server.address:port] [-c #channel1 #channel2 ...]')
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

  const bot = new PurpleBot({
    server: argv.server,
    channels: argv.channels,
    debug: argv.v
  })

  // eslint-disable-next-line no-unused-vars
  const cli = new Cli(bot)
  bot.connect()
}
