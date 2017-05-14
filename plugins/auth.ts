/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import { Plugin } from '../src/plugins'
import PurpleBot from '../src/bot'
import Config from '../src/config'

/**
 * Plugin to authenticate with NickServ.
 */
export default class AuthPlugin implements Plugin {
  readonly name = 'auth'

  bot: PurpleBot
  config: Config

  /**
   * @listens connect
   */
  async load (bot: PurpleBot, config: Config): Promise<void> {
    this.bot = bot
    this.config = config

    if (await config.get(`auth:enabled`) !== false) {
      bot.on('connect', async (server) => {
        const nickname = await config.get(`${this.name}:nick`)
        if (nickname == null) return false
        const password = await config.get(`${this.name}:pass`)

        if (password != null) {
          bot.say('NickServ', `GHOST ${nickname} ${password}`)
        }
        bot.setNick(nickname)
        if (password != null) {
          bot.say('NickServ', `IDENTIFY ${password}`)
        }
      })
    }
  }
}
