const JSDOM = require('jsdom').JSDOM

// http://stackoverflow.com/a/17773849/1440740
const matcher = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/

function run (bot) {
  bot.on('message#', (nick, to, text, message) => {
    const result = matcher.exec(text)
    if (result != null) {
      const link = result[0]
      // TODO: log found link
      bot.emit('web', nick, to, link)
    }
  })

  bot.on('web', (nick, to, link) => {
    JSDOM.fromURL(link).then((dom) => {
      const title = dom.window.document.title

      bot.say(to, `${link}: ${title}`)
    }, (reason) => {
      // TODO: error(`plugin.web: Failed to get title for ${link}: ${reason}`)
    })
  })
}

module.exports = run
