const os = require('os')
const path = require('path')

const name = 'purplebot'

/**
 * @returns {string}
 */
function datadir () {
  return path.join(os.homedir(), `.${name}`)
}

/**
 * @returns {string}
 */
function tmpdir () {
  return path.join(os.tmpdir(), name)
}

module.exports.datadir = datadir
module.exports.tmpdir = tmpdir
