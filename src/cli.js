const readline = require('readline')

class Cli {
  static get globalCommands () {
    const map = new Map()
    map.set('quit', (...args) => {
      console.log('')
      process.exit(0)
    })
    return map
  }

  /**
   * Creates an active Console instance.
   *
   * @param {events?} target
   * @param {stream.Readable} [input=process.stdin]
   * @param {stream.Writable} [output=process.stdout]
   *
   * @memberOf Console
   */
  constructor (target, input = process.stdin, output = process.stdout) {
    this.target = target
    this.output = output
    this.readline = readline.createInterface({
      input: input,
      output: output,
      completer: this.completer.bind(this)
    })

    if (this.target != null) {
      this.attachListeners()
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

      this.readline.prompt()
    })

    this.readline.prompt()
  }

  /**
   * Attach listeners to `this.target`.
   *
   * @memberOf Cli
   * @private
   */
  attachListeners () {
    const attach = function (event) {
      this.target.on(event, (...args) => {
        this.output.clearLine()
        this.readline.write(`* ${event}\n`)
        this.readline.prompt()
      })
    }.bind(this)

    attach('connected')
    attach('disconnected')
    attach('join')
    attach('part')
  }

  /**
   * Readline completer function
   *
   * @param {string} line
   * @param {Function} callback
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
