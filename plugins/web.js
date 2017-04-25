const JSDOM = require('jsdom').JSDOM
const mime = require('mime-types')
const request = require('request')

// http://stackoverflow.com/a/17773849/1440740
const matcher = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/

function run (bot) {
  bot.on('message#', (nick, to, text, message) => {
    const result = matcher.exec(text)
    if (result != null) {
      const link = result[0]
      bot.emit('web', nick, to, link)
    }
  })

  bot.on('web', (nick, to, link) => {
    request.get(link, (err, response, body) => {
      if (err) {
        // TODO: log error
      } else if (response.statusCode === 200) {
        const type = response.headers['content-type']
        if (type == null || type === 'text/html') {
          // TODO: handle bad content types
          const dom = new JSDOM(body)
          const title = dom.window.document.title
          // TODO: log found link
          bot.say(to, `${link}: ${title}`)
        } else {
          const ext = mime.extension(type)
          if (ext === 'png' || ext === 'jpg' || ext === 'gif' || ext === 'webm') {
            // TODO: save image or somesuch
            bot.emit('image', ext, response)
          }
        }
      }
    })
  })
}

module.exports = run
