import { expect } from 'chai'

import MockIrcd from './mock/ircd'
import PurpleBot from '../src/bot'

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
    const socket = ircd.socket
    bot = new PurpleBot({
      server: socket,
      socket: true
    })

    expect(bot).to.exist
    expect(ircd).to.exist

    return [bot, ircd]
  })

  it('connect & disconnect', (done) => {
    bot.connect(() => {
      bot.disconnect(null, done)
    })
  })

  it('connect & join & part', function (done) {
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

    bot.connect(() => {
      expect(bot.nick).to.equal(nick)
      bot.join(channel, () => {
        bot.part(channel, () => {
          let error
          if (!gotTopic) {
            error = new Error('Did not get topic')
          } else if (!gotNames) {
            error = new Error('Did not get names')
          }
          done(error)
        })
      })
    })
  })
})
