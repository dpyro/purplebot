const irc = require('irc')

const cli = require('./cli')
const logging = require('./logging')

/**
 * Builds a command callback map for a client.
 *
 * @param {irc.Client} client
 * @returns {Map<string, function(): void>} command callback map
 */
function createCommands (client) {
  const commands = new Map()

  commands.set('connect', (...args) => {
    client.connect(1)
  })

  commands.set('disconnect', (...args) => {
    const reason = args.shift() || 'Disconnecting'
    client.disconnect(reason)
  })

  commands.set('quit', (...args) => {
    process.exit(0)
  })

  return commands
}

class PurpleBot {
  constructor (options) {
    const nick = options.nick || 'PurpleBot'
    this.server = options.server || 'localhost'
    const clientOptions = {
      userName: nick,
      realName: nick,
      channels: options.channels || [],
      showErrors: false,
      autoConnect: false,
      autoRejoin: true,
      floodProtection: true,
      debug: false
    }
    this.client = new irc.Client(
      this.server,
      nick,
      clientOptions
    )
    this.nicks = {}

    this.configureClient()

    const commands = createCommands(this.client)

    this.cli = cli(commands)
  }

  configureClient () {
    logging(this.client, `${this.server}.log`)

    this.client.addListener('error', (message) => {
      console.error(`Error: ${message.command}: ${message.args.join(' ')}`)
    })

    this.client.addListener('invite', (channel, from, message) => {
      this.client.join(channel)
    })

    this.client.addListener('names', (channel, nicks) => {
      this.nicks[channel] = nicks
    })
  }

  enable () {
    this.client.connect()
  }

  disable () {
    this.client.disconnect()
  }
}

const options = {
  server: 'localhost',
  channels: ['#test']
}
const bot = new PurpleBot(options)
bot.enable()
