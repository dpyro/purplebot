/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

// @ts-ignore
import { JSDOM } from 'jsdom'
import mime from 'mime-types'
import request from 'request'

// http://stackoverflow.com/a/17773849/1440740
const matcher = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/

/**
 * Plugin to snarf URLs and images.
 *
 * @prop {Array<string>} imageExts
 *
 * @implements {Plugin}
 */
class WebPlugin {
  /**
   * Creates an instance of WebPlugin.
   *
   * @param {PurpleBot} bot
   *
   * @memberOf WebPlugin
   */
  constructor (bot) {
    this.imageExts = [
      'gif',
      'jpg',
      'png',
      'webm',
      'webp'
    ]

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
            bot.emit('title', to, link, title)
          } else {
            const ext = mime.extension(type)
            if (typeof ext !== 'boolean' && this.imageExts.indexOf(ext) !== -1) {
              // TODO: save image or somesuch
              bot.emit('web.image', to, link, ext, body)
            }
          }
        }
      })
    })

    bot.on('title', (channel, link, title) => {
      bot.say(channel, `${link}: ${title}`)
    })

    bot.on('web.image', (channel, link, ext, body) => {

    })
  }
}

function init (bot) {
  return new WebPlugin(bot)
}

export default init
export { WebPlugin }
