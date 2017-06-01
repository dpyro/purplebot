import 'babel-polyfill'
import { expect } from 'chai'

import { FileConfig } from '../src/config'
import { Hostmask, User, UserDatabase } from '../src/user'

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

    let hostmask = new Hostmask(user)
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

    let users = await db.matchUsersHostmask()
    expect(users).to.not.be.empty
    expect(users[0].id).to.equal(id)

    users = await db.matchUsersHostmask('*', username, 'dontmatchthis')
    expect(users).to.be.empty
  })

  it('delete user', async function () {
    let user = new User()
    user.name = 'testname'

    const userId = await db.setUser(user)
    expect(userId).to.be.at.least(0)

    let hostmask = new Hostmask(userId)
    hostmask.username = username
    hostmask.hostname = 'testhost'

    const hostmaskId = await db.setHostmask(hostmask)
    expect(hostmaskId).to.be.at.least(0)

    await db.deleteUser(userId)

    expect(await db.getUser(userId)).to.not.exist
    expect(await db.getHostmask(hostmaskId)).to.not.exist
  })

  it('admin permission', async function () {
    let user = new User()
    user.name = 'testname'

    const userId = await db.setUser(user)
    expect(userId).to.be.at.least(0)

    user = await db.getUser(userId)
    expect(user.admin).to.be.false

    let adminUser = new User()
    adminUser.name = 'testadmin'
    adminUser.admin = true

    const adminId = await db.setUser(adminUser)
    expect(adminId).to.be.at.least(0)

    adminUser = await db.getUser(adminId)
    expect(adminUser.admin).to.be.true
  })

  it('unique constraint on User.name', async function () {
    const user = new User()
    user.name = username

    await db.setUser(user)
    expect(user.id).to.be.at.least(0)

    const duplicateUser = new User()
    duplicateUser.name = username

    expect(() => db.setUser(duplicateUser)).to.throw
  })

  it('unique constraint on Hostmask', async function () {
    const user = new User()

    await db.setUser(user)
    expect(user.id).to.be.at.least(0)

    const hostmask = new Hostmask(user)
    hostmask.username = username
    hostmask.hostname = hostname

    await db.setHostmask(hostmask)

    hostmask.id = undefined

    expect(() => db.setHostmask(hostmask)).to.throw
  })
})
