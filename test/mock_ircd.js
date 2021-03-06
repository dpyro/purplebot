import 'babel-polyfill'
import { expect } from 'chai'

import MockIrcd from './mock/ircd'
import { init } from '../src/bot'
import { FileConfig } from '../src/config'

const nick = 'testnick'
const channel = '#test'
const topic = 'hello world!'
const nicks = ['client1', 'someone']

const responses = new Map()
responses.set(/USER (\w+) \d \* \w+/, (ircd, user) => {
  ircd.register()
})
responses.set(/JOIN (#\w+)/, (ircd, channel) => {
  ircd.join(channel, topic, nicks)
})
responses.set(/PART (#\w+)(?: :(\w+))?/, (ircd, channel, message) => {
  ircd.part(channel, message)
})

describe('mock ircd', function () {
  this.timeout(8000)
  this.slow(3000)

  let ircd, bot, config

  beforeEach(async function () {
    ircd = new MockIrcd(nick, (data) => {
      for (const [regex, action] of responses) {
        const results = regex.exec(data)
        if (results != null) {
          const args = results.slice(1)
          action(ircd, ...args)
          break
        }
      }
    })

    expect(ircd).to.exist
    const socket = ircd.socket

    config = await FileConfig.temp()
    await config.set('server', `socket://${socket}`)

    bot = await init(config)
    expect(bot).to.exist
  })

  afterEach(async function () {
    await config.removeDir()
  })

  it('connect(), disconnect()', async function () {
    await bot.connect()
    await bot.disconnect()
  })

  it('connect(), join(), part()', async function () {
    this.timeout(10000)

    let gotTopic = false
    let gotNames = false

    bot.on('topic', (channel, topic, nick, message) => {
      expect(bot.client.chans[channel].topic).to.equal(topic)
      gotTopic = true
    })

    bot.on('names', (channel, nicks) => {
      expect(nicks).to.not.be.empty
      gotNames = true
    })

    await bot.connect()
    expect(bot.nick).to.equal(nick)
    await bot.join(channel)
    await bot.part(channel)
    expect(gotTopic).to.be.true
    expect(gotNames).to.be.true
  })

  it('auth', async function () {
    const nick = 'testnick'
    const pass = 'testpass'
    await config.set('auth:nick', nick)
    await config.set('auth:pass', pass)

    const responses = [
      `GHOST ${nick} ${pass}`,
      `IDENTIFY ${pass}`
    ]

    return new Promise(async (resolve, reject) => {
      bot.on('self', (to, text) => {
        try {
          expect(to).to.equal('NickServ')
          expect(text).to.equal(responses.shift())

          if (responses.length === 0) {
            resolve()
          }
        } catch (err) {
          reject(err)
        }
      })

      await bot.connect()
    })
  })
})
