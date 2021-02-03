#!/usr/bin/env node

const ejs = require('ejs')
const fs = require('fs')
const path = require('path')
const sortedObject = require('sorted-object')
const util = require('util')
const MODE_0755 = parseInt('0755', 8)

const program = require('./prompt')
const {
  launchedFromCmd,
  exit,
  copyTemplate,
  write,

  copyTemplateMulti,
  confirm,
  mkdir,
  createAppName,
  emptyDirectory
} = require('./utils')

const { createPackage, addDependency } = require('./package-tmpl')

// Re-assign process.exit because of commander
process.exit = exit

if (!exit.exited) {
  main()
}

const getFuncBody = method => method.toString().replace(/^\W*(function[^{]+\{([\s\S]*)\}|[^=]+=>[^{]*\{([\s\S]*)\}|[^=]+=>(.+))/i, '$2$3$4')

function createApplication(name, dir) {
  // Package
  const pkg = createPackage(name)

  // JavaScript
  const app = loadTemplate('js/app.js')
  const addUse = (cb) => {
    let body = cb.toString()
    body = body.slice(body.indexOf('=>') + 2)
    app.locals.uses.push(body)
  }

  // App modules
  app.locals.localModules = Object.create(null)
  app.locals.modules = Object.create(null)
  app.locals.mounts = []
  app.locals.uses = []

  // Request logger
  app.locals.modules.logger = 'morgan'
  addUse((logger) => logger('dev'))
  addDependency(pkg, 'morgan', '~1.9.1')

  // Body parsers
  app.locals.uses.push('express.json()')
  app.locals.uses.push('express.urlencoded({ extended: false })')

  // Cookie parser
  app.locals.modules.cookieParser = 'cookie-parser'
  app.locals.uses.push('cookieParser()')
  addDependency(pkg, 'cookie-parser', '~1.4.4')

  if (dir !== '.') {
    mkdir(dir, '.')
  }

  ['public', 'routes'].forEach(p => mkdir(dir, p))
  copyTemplateMulti('js/routes', dir + '/routes', '*.js')

  if (program.view) {
    // Copy view templates
    mkdir(dir, 'views')
    pkg.dependencies['http-errors'] = '~1.6.3'
    switch (program.view) {
      case 'ejs':
        copyTemplateMulti('views', dir + '/views', '*.ejs')
        break
    }
  } else {
    // Copy extra public files
    copyTemplate('js/index.html', path.join(dir, 'public/index.html'))
  }

  // Index router mount
  app.locals.localModules.indexRouter = './routes/index'
  app.locals.mounts.push({ path: '/', code: 'indexRouter' })

  // User router mount
  app.locals.localModules.usersRouter = './routes/users'
  app.locals.mounts.push({ path: '/users', code: 'usersRouter' })

  // Template support
  switch (program.view) {
    case 'ejs':
      app.locals.view = { engine: 'ejs' }
      addDependency(pkg, 'ejs', '~2.6.1')
      break
    default:
      app.locals.view = false
      break
  }

  // Static files
  app.locals.uses.push("express.static(path.join(__dirname, 'public'))")

  if (program.git) {
    copyTemplate('js/gitignore', path.join(dir, '.gitignore'))
  }

  // sort dependencies like npm(1)
  pkg.dependencies = sortedObject(pkg.dependencies)

  // write files
  write(path.join(dir, 'app.js'), app.render())
  write(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')

  const prompt = launchedFromCmd() ? '>' : '$'

  if (dir !== '.') {
    console.log()
    console.log('   change directory:')
    console.log('     %s cd %s', prompt, dir)
  }

  console.log()
  console.log('   install dependencies:')
  console.log('     %s npm install', prompt)
  console.log()
  console.log('   run the app:')

  if (launchedFromCmd()) {
    console.log('     %s SET DEBUG=%s:* & npm start', prompt, name)
  } else {
    console.log('     %s DEBUG=%s:* npm start', prompt, name)
  }

  console.log()
}

/**
 * Load template file.
 */

function loadTemplate(name) {
  const contents = fs.readFileSync(path.join(__dirname, '..', 'templates', (name + '.ejs')), 'utf-8')
  const locals = Object.create(null)

  function render() {
    return ejs.render(contents, locals, {
      escape: util.inspect
    })
  }

  return {
    locals,
    render
  }
}

/**
 * Main program.
 */

function main() {
  // Path
  const destinationPath = program.args.shift() || '.'

  // App name
  const appName = createAppName(path.resolve(destinationPath)) || 'hello-world'

  // View engine
  if (program.view === true) {
    program.view = 'ejs'
  }

  // Generate application
  emptyDirectory(destinationPath, function (empty) {
    if (empty || program.force) {
      createApplication(appName, destinationPath)
    } else {
      confirm('???OVERWRITE???? [y/N] ', function (ok) {
        if (ok) {
          process.stdin.destroy()
          createApplication(appName, destinationPath)
        } else {
          console.error('aborting')
          exit(1)
        }
      })
    }
  })
}
