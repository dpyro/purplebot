/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 */

import * as readline from 'readline'
import * as _ from 'lodash'

import PurpleBot from './bot'

export interface CommandMap {
  commands: {[key in string]: (...any) => void}
}

/**
 * Encapulates a readline interface.
 *
 * @memberof module:purplebot
 */
export default class Cli {
  target: PurpleBot
  input: NodeJS.ReadableStream
  output: NodeJS.WritableStream
  readline: readline.ReadLine

  /**
   * Creates an active `Cli` instance.
   *
   * @memberOf Console
   */
  constructor (target: PurpleBot,
               input: NodeJS.ReadableStream = process.stdin,
               output: NodeJS.WritableStream = process.stdout) {
    this.target = target
    this.input = input
    this.output = output
    this.readline = readline.createInterface({
      input: input,
      output: output,
      completer: this.completer.bind(this)//,
      //prompt: ''
    })

    if (this.target != null) {
      this._attachListeners()
    }

    // More events at: https://nodejs.org/api/readline.html#readline_class_interface
    this.readline.on('line', (line) => {
      const params = line.split(' ')

      const command = params.shift()
      if (command != null) {
        const callback = this.target.commands[command] || this.globalCommands[command]
        if (callback != null) {
          callback.apply(null, params)
        }
      }
    })
  }

  /**
   * Attach listeners to `this.target`.
   *
   * @memberOf Cli
   */
  private _attachListeners () {
    this.target.on('error', (message) => {
      readline.clearLine(this.output, -1)
      this.readline.write(`${message.command}\n`)
    })

    const attach = (event) => {
      this.target.on(event, (...args) => {
        readline.clearLine(this.output, 0)
        this.readline.write(`* ${_.capitalize(event)}ed\n`)
      })
    }

    attach('connect')
    attach('disconnect')
    attach('join')
    attach('names')
    attach('part')
    attach('topic')
  }

  /**
   * Universal commands
   *
   * @static
   * @readonly
   * @memberOf Cli
   */
  get globalCommands (): {[key in string]: (...any) => void} {
    return {
      'quit': (...args) => {
        console.log('')
        process.exit(0)
      }
    }
  }

  commands (line: string): string[] {
    let results =
      _.keys(this.target.commands)
      .concat(_.keys(this.globalCommands))
    if (line.length > 0) {
      results = results.filter(key => key.startsWith(line))
    }
    return results
  }

  /**
   * Readline completer function
   *
   * @memberOf Console
   */
  completer (line: string, callback: (...any) => void): void {
    const results = this.commands(line)

    callback(null, [results, line])
  }
}
