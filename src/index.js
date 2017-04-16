const cli = require('./cli')
const logging = require('./logging')

const irc = require('irc')



class PurpleBot {
  constructor (options) {
    const nick = options.nick || 'PurpleBot'
    this.server = options.server || 'localhost'
    const clientOptions = {
      userName: nick,
      realName: nick,
      channels: options.channels || [],
      showErrors: true,
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

    const commands = this.configureCommands()

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

  configureCommands () {
    const commands = new Map()
    commands.set('quit', () => {
      process.exit(0)
    })
    commands.set('reconnect', () => {
      this.client.disconnect('Reconnecting', () => {
        this.client.connect(2)
      })
    })
    return commands
  }

  enable () {
    this.client.connect()
  }

  disable () {
    this.client.disconnect()
  }
}

function command (line) {
  console.log(`got ${line}`)
}

const options = {
  server: 'localhost',
  channels: ['#test']
}
const bot = new PurpleBot(options)
bot.enable()
