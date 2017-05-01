import 'babel-polyfill'
import { expect } from 'chai'

import initKarma from '../plugins/karma'

describe('plugin: karma', function () {
  const name = 'chameleon'
  const user = 'testuser'
  let plugin

  // TODO: use custom test config
  beforeEach(async function () {
    plugin = await initKarma()
    expect(plugin).to.exist

    await plugin.resetDatabase()
    const output = await plugin.top()
    expect(output).to.be.empty
  })

  it('starts empty', async function () {})

  it('get 1 row', function () {
    return plugin.add(name, user, 10)
      .then(() => plugin.get(name))
      .then(total => expect(total).to.equal(10))
  })
})
