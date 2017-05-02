import 'babel-polyfill'
import { expect } from 'chai'
import EventEmitter from 'events'

import initKarma from '../plugins/karma'

describe('plugin: karma', function () {
  const nick = 'chameleon'
  const user = 'testuser'
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

  it('starts empty', async function () {})

  it('get 1 row', function () {
    return plugin.add(nick, user, 10)
      .then(() => plugin.get(nick))
      .then(total => expect(total).to.equal(10))
  })

  const valids = [
    'term++', ' term++', 'term++ ', 'this term++',
    'term--', ' term--', 'term-- ', 'another term--'
  ]
  for (const valid of valids) {
    it(`recognizes: "${valid}"`, function (done) {
      emitter.on('karma.respond', (fromNick, to, term, karma) => {
        let error

        try {
          expect(fromNick).to.equal(nick)
          expect(to).to.equal(channel)
          expect(term).to.equal('term')
          expect(karma).to.exist
        } catch (err) {
          error = err
        }

        done(error)
      })

      emitter.emit('message#', nick, channel, valid)
    })
  }
})
