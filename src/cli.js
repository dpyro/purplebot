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
 * @returns {readline.ReadLine} the active configured interface
 */
function createReadlineInterface (commands) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (line, callback) => {
      completer(commands, line, callback)
    }
  })

  // More events at: https://nodejs.org/api/readline.html#readline_class_interface
  rl.on('line', (line) => {
    const callback = commands.get(line)
    if (callback != null) {
      callback()
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
