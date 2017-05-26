import 'babel-polyfill'
import { expect } from 'chai'

import { FileConfig } from '../src/config'
import User, { UserDatabase } from '../src/user'

describe('user', function () {
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

    const id = await db.set(user)
    expect(id).to.be.at.least(0)

    const results = await db.db.all('SELECT * FROM view')
    expect(results).to.exist
    expect(results.length).to.equal(1)

    user = await User.get(db, id)
    expect(user).to.exist
  })
})
