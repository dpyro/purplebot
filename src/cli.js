const readline = require('readline')
const _ = require('lodash')

/**
 * Encapulates a readline interface.
 *
 * @class Cli
 */
class Cli {
  /**
   * Universal commands
   *
   * @returns {Map<string, function(...): void>}
   * @readonly
   * @static
   *
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
   * @param {EventEmitter} target
   * @param {stream.Readable} [input=process.stdin]
   * @param {stream.Writable} [output=process.stdout]
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
        this.output.clearLine()
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
   * @param {function(...): void} callback
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

module.exports = Cli
