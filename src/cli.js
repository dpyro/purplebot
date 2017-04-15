const readline = require('readline')

/**
 * Create an active bound readline interface using `stdin` and `stdout`.
 *
 * @param {function(string): void} callback handler for each inputed line
 * @returns {readline.ReadLine} the active configured interface
 */
function createReadlineInterface (callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
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
