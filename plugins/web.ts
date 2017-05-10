/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import { JSDOM } from 'jsdom'
import { extension } from 'mime-types'
import * as request from 'request'

import { Plugin } from '../src/plugins'
import PurpleBot from '../src/bot'
import Config from '../src/config'

// http://stackoverflow.com/a/17773849/1440740
const matcher = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/

/**
 * Plugin to snarf URLs and images.
 */
export default class WebPlugin implements Plugin {
  bot: PurpleBot
  imageExts: String[] = [
    'gif',
    'jpg',
    'png',
    'webm',
    'webp'
  ]

  /**
   * @fires web.link
   */
  async load (bot: PurpleBot): Promise<boolean> {
    this.bot = bot

    bot.on('message#', (nick, to, text, message) => {
      const result = matcher.exec(text)
      if (result != null) {
        const link = result[0]
        bot.emit('web.link', nick, to, link)
      }
    })

    bot.on('web.link', async (nick, to, link) => {
      try {
        await this.handleLink(nick, to, link)
      } catch (err) {
        // ignore
      }
    })

    bot.on('web.title', (channel, link, title) => {
      bot.say(channel, `${link}: ${title}`)
    })

    return true
  }

  async handleLink (nick: string, to: string, link: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      request.get(link, (err, response, body) => {
        if (err != null) {
          reject(err)
        } else if (response.statusCode === 200) {
          const type = response.headers['content-type']
          if (type == null || type === 'text/html') {
            // TODO: handle bad content types
            const dom = new JSDOM(body)
            const title = dom.window.document.title
            // TODO: log found link
            this.bot.emit('web.title', to, link, title)
            resolve()
          } else {
            const ext = extension(type)
            if (typeof ext !== 'boolean' && this.imageExts.indexOf(ext) !== -1) {
              // TODO: save image or somesuch
              this.bot.emit('web.image', to, link, ext, body)
              resolve()
            } else {
              reject()
            }
          }
        }
      })
    })
  }

  toString (): string {
    return `[WebPlugin ${this.bot}]`
  }
}
