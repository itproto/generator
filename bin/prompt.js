
const VERSION = require('../package').version
const program = require('commander')
const {
  before,
  around
} = require('./utils')

around(program, 'optionMissingArgument', function (fn, args) {
  program.outputHelp()
  fn.apply(this, args)
  return { args: [], unknown: [] }
})

before(program, 'outputHelp', function () {
  // track if help was shown for unknown option
  this._helpShown = true
})

before(program, 'unknownOption', function () {
  // allow unknown options if help was shown, to prevent trailing error
  this._allowUnknownOption = this._helpShown

  // show help if not yet shown
  if (!this._helpShown) {
    program.outputHelp()
  }
})

program
  .name('express')
  .version(VERSION, '    --version')
  .usage('[options] [dir]')
  .option('-v, --view <engine>', 'add ejs', false)
  .option('--https', 'add https support')
  .option('--test', 'add SuperTest')
  .option('-f, --force', 'force on non-empty directory')
  .option('-a, --add <generator>', 'surprise')
  .option('--noErrors', '', false)
  .option('--withLog')
  .parse(process.argv)

module.exports = program
