/**
 * @author Sumant Manne <sumant.manne@gmail.com>
 * @license MIT
 * @module purplebot
 */

import readline from 'readline'
import _ from 'lodash'

/**
 * Encapulates a readline interface.
 */
class Cli {
  /**
   * Universal commands
   *
   * @returns {Map<string, function(...any): void>}
   *
   * @static
   * @readonly
   * @memberOf Cli
   */
  static get globalCommands () {
    const map = new Map()
    map.set('quit', (...args) => {
      console.log('')
      process.exit(0)
    })
    return map
  }

  /**
   * Creates an active `Cli` instance.
   *
   * @param {purplebot/PurpleBot} target
   * @param {NodeJS.ReadableStream} [input=process.stdin]
   * @param {NodeJS.WritableStream} [output=process.stdout]
   *
   * @memberOf Console
   */
  constructor (target, input = process.stdin, output = process.stdout) {
    this.target = target
    this.input = input
    this.output = output
    this.readline = readline.createInterface({
      input: input,
      output: output,
      completer: this.completer.bind(this),
      // @ts-ignore
      prompt: ''
    })

    if (this.target != null) {
      this._attachListeners()
    }

    // More events at: https://nodejs.org/api/readline.html#readline_class_interface
    this.readline.on('line', (line) => {
      const params = line.split(' ')

      const command = params.shift()
      if (command != null) {
        const callback = this.target.commands.get(command) || Cli.globalCommands.get(command)
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
   * @private
   */
  _attachListeners () {
    this.target.on('error', (message) => {
      this.readline.clearLine(this.readline, -1)
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
   * Readline completer function
   *
   * @param {string} line
   * @param {function(...any): void} callback
   *
   * @memberOf Console
   */
  completer (line, callback) {
    let results = []

    if (line.length === 0) {
      results = [...this.target.commands.keys(), ...Cli.globalCommands.keys()]
    } else {
      results = [...this.target.commands.keys(), ...Cli.globalCommands.keys()].filter((key) => {
        return key.startsWith(line)
      })
    }

    callback(null, [results, line])
  }
}

export default Cli
