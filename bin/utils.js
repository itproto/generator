
var fs = require('fs')
var minimatch = require('minimatch')
var mkdirp = require('mkdirp')
var path = require('path')
var readline = require('readline')
var util = require('util')

var MODE_0666 = parseInt('0666', 8)
var MODE_0755 = parseInt('0755', 8)
var TEMPLATE_DIR = path.join(__dirname, '..', 'templates')

function getFuncBody(f) {
  const matches = f.toString().match(/^(?:\s*\(?(?:\s*\w*\s*,?\s*)*\)?\s*?=>\s*){?([\s\S]*)}?$/)
  if (!matches) {
    return undefined
  }

  const firstPass = matches[1]

  // Needed because the RegExp doesn't handle the last '}'.
  const secondPass =
    (firstPass.match(/{/g) || []).length === (firstPass.match(/}/g) || []).length - 1
      ? firstPass.slice(0, firstPass.lastIndexOf('}'))
      : firstPass

  return secondPass
}

/**
 * Create an app name from a directory path, fitting npm naming requirements.
 *
 * @param {String} pathName
 */

function createAppName(pathName) {
  return path.basename(pathName)
    .replace(/[^A-Za-z0-9.-]+/g, '-')
    .replace(/^[-_.]+|-+$/g, '')
    .toLowerCase()
}

/**
 * Check if the given directory `dir` is empty.
 *
 * @param {String} dir
 * @param {Function} fn
 */

function emptyDirectory(dir, fn) {
  fs.readdir(dir, function (err, files) {
    if (err && err.code !== 'ENOENT') throw err
    fn(!files || !files.length)
  })
}

var _exit = process.exit
/**
 * Graceful exit for async STDIO
 */

function exit(code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done() {
    if (!(draining--)) _exit(code)
  }

  var draining = 0
  var streams = [process.stdout, process.stderr]

  exit.exited = true

  streams.forEach(function (stream) {
    // submit empty write request and wait for completion
    draining += 1
    stream.write('', done)
  })

  done()
}

/**
 * Determine if launched from cmd.exe
 */

function launchedFromCmd() {
  return process.platform === 'win32' &&
        process.env._ === undefined
}

/**
 * Make the given dir relative to base.
 *
 * @param {string} base
 * @param {string} dir
 */

function mkdir(base, dir) {
  var loc = path.join(base, dir)
  console.log('   \x1b[36mcreate\x1b[0m : ' + loc + path.sep)
  // The folders will be readable and executed by others, but writable by the user only.
  mkdirp.sync(loc, MODE_0755)
}

/**
 * Generate a callback function for commander to warn about renamed option.
 *
 * @param {String} originalName
 * @param {String} newName
 */

function renamedOption(originalName, newName) {
  return function (val) {
    warning(util.format("option `%s' has been renamed to `%s'", originalName, newName))
    return val
  }
}

/**
 * Display a warning similar to how errors are displayed by commander.
 *
 * @param {String} message
 */

function warning(message) {
  console.error()
  message.split('\n').forEach(function (line) {
    console.error('  warning: %s', line)
  })
  console.error()
}

/**
 * echo str > file.
 *
 * @param {String} file
 * @param {String} str
 */

function write(file, str, mode) {
  fs.writeFileSync(file, str, { mode: mode || MODE_0666 })
  console.log('   \x1b[36mcreate\x1b[0m : ' + file)
}

/**
 * Install an around function; AOP.
 */

function around(obj, method, fn) {
  var old = obj[method]

  obj[method] = function () {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) args[i] = arguments[i]
    return fn.call(this, old, args)
  }
}

/**
 * Install a before function; AOP.
 */

function before(obj, method, fn) {
  var old = obj[method]

  obj[method] = function () {
    fn.call(this)
    old.apply(this, arguments)
  }
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 */

function confirm(msg, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(msg, function (input) {
    rl.close()
    callback(/^y|yes|ok|true$/i.test(input))
  })
}

/**
 * Copy file from template directory.
 */

function copyTemplate(from, to) {
  write(to, fs.readFileSync(path.join(TEMPLATE_DIR, from), 'utf-8'))
}

/**
 * Copy multiple files from template directory.
 */

function copyTemplateMulti(fromDir, toDir, nameGlob) {
  fs.readdirSync(path.join(TEMPLATE_DIR, fromDir))
    .filter(minimatch.filter(nameGlob, { matchBase: true }))
    .forEach(function (name) {
      copyTemplate(path.join(fromDir, name), path.join(toDir, name))
    })
}

const getFinalPrompt = (dir) => {
  const term = launchedFromCmd() ? '>' : '$'
  const cdPrompt = `
change directory:
  ${term} cd ${dir}
`
  return `
${dir !== '.' ? cdPrompt : ''}
install dependencies:
  ${term} npm install

run the app:
  ${term} DEBUG=${dir}:* npm start
`
}

/**
 * Load template file.
 */

const ejs = require('ejs')

function loadTemplate(name) {
  const templatesDir = path.join(__dirname, '..', 'templates')
  const contents = fs.readFileSync(path.join(templatesDir, (name + '.ejs')), 'utf-8')
  const locals = Object.create(null)

  function render() {
    return ejs.render(contents, locals, {
      escape: util.inspect,
      views: [
        templatesDir
      ]
    })
  }

  return {
    locals,
    render
  }
}

const prettyJson = (src) => JSON.stringify(src, null, 2)

module.exports = {
  launchedFromCmd,
  exit,
  copyTemplate,
  write,
  warning,
  copyTemplateMulti,
  confirm,
  before,
  around,
  mkdir,
  createAppName,
  renamedOption,
  emptyDirectory,
  getFuncBody,
  getFinalPrompt,
  loadTemplate,
  prettyJson

}
