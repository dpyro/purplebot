/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import { JSDOM } from 'jsdom'
import { extension } from 'mime-types'
import * as request from 'request'

import { Plugin } from '../src/plugins'
import PurpleBot, { Context } from '../src/bot'
import Config from '../src/config'

/**
 * Plugin to snarf URLs and images.
 */
export default class WebPlugin implements Plugin {
  // http://stackoverflow.com/a/17773849/1440740
  protected static matcher =
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/

  readonly name = 'web'
  bot: PurpleBot
  imageExts: String[] = [
    'gif',
    'jpg',
    'png',
    'webm',
    'webp'
  ]

  /**
   * @listens message#
   * @listens web.title
   */
  async load (bot: PurpleBot): Promise<void> {
    this.bot = bot

    this.installHooks()
  }

  toString (): string {
    return `[WebPlugin ${this.bot}]`
  }

  /**
   * @fires web.title
   * @fires web.image
   * @throws Error
   */
  protected handleResponse (context: Context,
                            response: request.RequestResponse,
                            link: string,
                            body: any): void {
    if (response.statusCode !== 200) {
      throw new Error(`Error fetching ${link} (status code: ${response.statusCode}`)
    }

    const type = response.headers['content-type']
    if (type == null || type === 'text/html') {
      // TODO: handle bad content types
      const dom = new JSDOM(body)
      const title = dom.window.document.title
      // TODO: log found link
      this.bot.emit('web.title', context, link, title)
    } else {
      const ext = extension(type)
      if (typeof ext !== 'boolean' && this.imageExts.indexOf(ext) !== -1) {
        // TODO: save image or somesuch
        this.bot.emit('web.image', context, link, ext, body)
      } else {
        throw new Error(`Error fetching ${link} (MIME type: ${type})`)
      }
    }
  }

  protected async handleLink (context: Context, link: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      request.get(link, (err, response, body) => {
        if (err != null) {
          // reject(err)
        } else {
          try {
            this.handleResponse(context, response, link, body)
            resolve()
          } catch (err) {
            reject(err)
          }
        }
      })
    })
  }

  private installHooks (): void {
    this.bot.on('message#', async (nick, to, text, message) => {
      const result = WebPlugin.matcher.exec(text)
      if (result !== null) {
        const link = result[0]
        await this.handleLink({ nick, to }, link)
      }
    })

    this.bot.on('web.title', (context: Context, link, title) => {
      this.bot.say(context.to, `${link}: ${title}`)
    })
  }
}
