import { expect } from 'chai'

import MockIrcd from './mock/ircd'
import initBot from '../src/bot'

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

  let ircd, bot

  beforeEach(function () {
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

    return initBot({server: socket, socket: true})
      .then(newBot => {
        expect(newBot).to.exist
        bot = newBot
      })
  })

  it('connect(), disconnect()', () => {
    return bot.connect()
      .then(() => bot.disconnect())
  })

  it('connect(), join(), part()', function () {
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

    return bot.connect()
      .then(() => expect(bot.nick).to.equal(nick))
      .then(() => bot.join(channel))
      .then(() => bot.part(channel))
      .then(() => {
        if (!gotTopic) throw new Error('Did not get topic')
        if (!gotNames) throw new Error('Did not get names')
      })
  })
})
