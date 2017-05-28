import 'babel-polyfill'
import { expect } from 'chai'

import { FileConfig } from '../src/config'
import User, { Hostmask, UserDatabase } from '../src/user'

describe('user', function () {
  const username = 'testuser'
  const hostname = 'testhost'
  let config, db

  beforeEach(async function () {
    config = await FileConfig.temp()
    expect(config).to.be.instanceof(FileConfig)

    db = new UserDatabase()
    await db.load(config)
    expect(db).to.be.instanceof(UserDatabase)
  })

  afterEach(async function () {
    await config.removeDir()
  })

  it('starts empty', async function () {
    const results = await db.getUser('*', '*', '*')
    expect(results).to.not.exist
  })

  it('set & get one user', async function () {
    let user = new User()
    user.name = 'testname'

    const id = await db.setUser(user)
    expect(id).to.be.at.least(0)

    const results = await db.db.all('SELECT * FROM view')
    expect(results).to.exist
    expect(results.length).to.equal(1)

    user = await db.getUser(id)
    expect(user).to.exist
  })

  it('set & get user by hostmask', async function () {
    let user = new User()
    user.name = 'testname'

    const id = await db.setUser(user)
    expect(id).to.be.at.least(0)

    let hostmask = new Hostmask(id)
    hostmask.username = username
    hostmask.hostname = 'testhost'

    const hostmaskId = await db.setHostmask(hostmask)
    expect(hostmaskId).to.be.at.least(0)

    const results = await db.db.all('SELECT * FROM view')
    expect(results).to.exist
    expect(results.length).to.equal(1)

    hostmask = await db.getHostmask(hostmaskId)
    expect(hostmask).to.exist
    expect(hostmask.username).to.equal(username)
    expect(hostmask.hostname).to.equal(hostname)

    let users = await db.matchHostmask()
    expect(users).to.not.be.empty
    expect(users[0].id).to.equal(id)

    users = await db.matchHostmask('*', username, 'dontmatchthis')
    expect(users).to.be.empty
  })
})
