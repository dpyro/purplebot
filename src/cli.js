const readline = require('readline')

/**
 * Asynchronous `readline` completer
 *
 * @param {string} line
 * @param {!function(...any): void} callback
 */
function completer (commands, line, callback) {
  let results = []

  if (line.length === 0) {
    results = [...commands.keys()]
  } else {
    results = [...commands.keys()].filter((key) => {
      return key.startsWith(line)
    })
  }

  callback(null, [results, line])
}

/**
 * Create an active bound readline interface using `stdin` and `stdout`.
 *
 * @param {!Map<string, function(...string): void>} commands mapping of command names to callbacks
 * @param {stream.Readable} input
 * @param {stream.Writable} output
 * @returns {readline.ReadLine} the active configured interface
 */
function createReadlineInterface (commands, input = process.stdin, output = process.stdout) {
  const rl = readline.createInterface({
    input: input,
    output: output,
    completer: (line, callback) => {
      completer(commands, line, callback)
    }
  })

  // More events at: https://nodejs.org/api/readline.html#readline_class_interface
  rl.on('line', (line) => {
    const params = line.split(' ')
    const command = params.shift()
    if (command != null) {
      const callback = commands.get(command)
      if (callback != null) {
        callback(params)
      }
    }

    rl.prompt()
  })

  rl.on('close', () => {
    console.log('')
    process.exit(0)
  })

  rl.prompt()

  return rl
}

module.exports = createReadlineInterface
