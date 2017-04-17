/**
 * Builds a command callback map for a client.
 *
 * @param {irc.Client} client
 * @returns {Map<string, function(): void>} command callback map
 */
function createCommands (client) {
  const commands = new Map()

  commands.set('connect', (...args) => {
    client.connect(1)
  })

  commands.set('disconnect', (...args) => {
    const reason = args.shift() || 'Disconnecting'
    client.disconnect(reason)
  })

  commands.set('quit', (...args) => {
    process.exit(0)
  })

  return commands
}

module.exports = createCommands
