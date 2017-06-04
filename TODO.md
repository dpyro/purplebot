# TODO

## Features

- [x] autologin
- [x] logging
- [ ] karma
  - [x] .karma info
  - [x] .karma set
  - [ ] .karma set admin-only
  - [.] .karma clear
  - [x] thing++ / ++thing
  - [x] thing-- / --thing
  - [ ] if nick, attach karma to account
- [ ] dict
  - [ ] .learn / .dict add
  - [ ] .info / .dict info
  - [ ] .forget / .dict remove
  - [ ] .forget / .dict remove admin-only
  - [x] thing?
  - [.] save images
- [.] list
  - [.] .list create \<name\>
  - [.] .list delete \<name\>
  - [.] .list add \<name\> \<value\>
  - [.] .list remove \<name\> \<value\>
- [.] web
  - [x] url snarfer
  - [.] log links
  - [.] show last link sent by user
- [.] heralds
- [ ] permissions
- [.] conversions
  - [.] temperature
  - [.] height
  - [.] weight

## Technical

- [ ] Bluebird promises
- [ ] Third-party pubsub for `PurpleBot` events
- [x] Convert `server` + `socket` option into `socket://`
- [ ] Use something simpler than `nconf`.
- [ ] Create `CommandMap` module.
- [ ] Add decorators.
- [ ] Unified users.
  - [ ] Last nick / aliases
  - [x] Hostmask
  - [ ] Plugin custom data
  - [ ] Bot admin permission
  - [.] Last seen

## Testing

- [x] add socket support to `node-irc`.
