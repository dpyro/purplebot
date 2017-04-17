const cli = require('./cli')
const irc = require('irc')

const commands = require('./commands')
const logging = require('./logging')

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

    this.cli = cli(commands(this.client))
  }

  enable () {
    this.client.connect()
  }

  disable () {
    this.client.disconnect()
  }
}

module.exports = PurpleBot
