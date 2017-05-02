import 'babel-polyfill'
import { expect } from 'chai'
import EventEmitter from 'events'

import initKarma from '../plugins/karma'

describe('plugin: karma', function () {
  const nick = 'chameleon'
  const channel = '#test'
  let emitter, plugin

  // TODO: use custom test config
  beforeEach(async function () {
    emitter = new EventEmitter()
    emitter.say = function () {

    }
    plugin = await initKarma(emitter)
    expect(plugin).to.exist

    await plugin.resetDatabase()
    const output = await plugin.top()
    expect(output).to.be.empty
  })

  it('top empty', async function () {
    const results = await plugin.top()
    expect(results).to.be.empty
  })

  it('get nonexistant', async function () {
    const result = await plugin.get('term')
    expect(result).to.not.exist
  })

  function checkValid (name, message, result) {
    it(`${name}: "${message}"`, async function () {
      return new Promise((resolve, reject) => {
        emitter.on('karma.respond', (fromNick, to, term, karma) => {
          try {
            expect(fromNick).to.equal(nick)
            expect(to).to.equal(channel)
            expect(term).to.equal('term')
            expect(karma).to.equal(result)
          } catch (error) {
            reject(error)
          }
          resolve()
        })
        emitter.emit('message#', nick, channel, message)
      })
    })
  }

  const increments = ['term++', ' term++', 'term++ ', 'this term++']
  for (const increment of increments) {
    checkValid('increments', increment, 1)
  }

  const decrements = ['term--', ' term--', 'term-- ', 'another term--']
  for (const decrement of decrements) {
    checkValid('decrements', decrement, -1)
  }

  it('increment & .karma', function () {
    emitter.on('karma.get', (nick, to, term, karma) => {
      expect(nick).to.equal(nick)
      expect(to).to.equal(channel)
      expect(term).to.equal('term')
      expect(karma).to.equal(1)
    })
    emitter.emit('message#', nick, channel, 'term++')
  })
})
