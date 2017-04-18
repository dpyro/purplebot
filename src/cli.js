const readline = require('readline')

class Cli {
  /**
   * Creates an active Console instance.
   *
   * @param {stream.Readable} [input=process.stdin]
   * @param {stream.Writable} [output=process.stdout]
   *
   * @memberOf Console
   */
  constructor (input = process.stdin, output = process.stdout) {
    this.commands = new Map()

    this.readline = readline.createInterface({
      input: input,
      output: output,
      completer: this.completer.bind(this)
    })

    // More events at: https://nodejs.org/api/readline.html#readline_class_interface
    this.readline.on('line', function (line) {
      const params = line.split(' ')
      const command = params.shift()
      if (command != null) {
        const callback = this.commands.get(command)
        if (callback != null) {
          callback(params)
        }
      }

      this.readline.prompt()
    }.bind(this))

    this.commands.set('quit', (...args) => {
      console.log('')
      process.exit(0)
    })

    this.readline.prompt()
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
      results = [...this.commands.keys()]
    } else {
      results = [...this.commands.keys()].filter((key) => {
        return key.startsWith(line)
      })
    }

    callback(null, [results, line])
  }

  /**
   * Assign commands from a command mapping to callbacks
   *
   * @param {Map<string, function(...string): void>} commandMap
   *
   * @memberOf Cli
   */
  setCommands (commandMap) {
    for (const [command, callback] of commandMap) {
      this.commands.set(command, callback)
    }
  }
}

module.exports = Cli
