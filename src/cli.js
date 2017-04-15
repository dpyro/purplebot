const readline = require('readline')

const commands = new Map()
commands.set('quit', () => {
  process.exit(0)
})
commands.set('reconnect', () => {

})

function completer (line, callback) {
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
 * @param {function(string): void} callback handler for each inputed line
 * @returns {readline.ReadLine} the active configured interface
 */
function createReadlineInterface (callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: completer
  })

  // More events at: https://nodejs.org/api/readline.html#readline_class_interface
  rl.on('line', (line) => {
    callback(line)
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
