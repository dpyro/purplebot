
const PurpleBot = require('./bot.js')

const options = {
  server: 'localhost',
  channels: ['#test']
}
const bot = new PurpleBot(options)
bot.enable()
