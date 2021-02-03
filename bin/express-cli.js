#!/usr/bin/env node

const path = require('path')
const args = require('./prompt')
const {
  getFinalPrompt,
  exit,
  copyTemplate,
  write,
  copyTemplateMulti,
  confirm,
  mkdir,
  createAppName,
  emptyDirectory,
  getFuncBody,
  loadTemplate,
  prettyJson
} = require('./utils')

const { createPackage, addDependency } = require('./package-tmpl')
const getWorkingDir = () => path.resolve(args.args.shift() || '.')
// Re-assign process.exit because of commander
process.exit = exit

if (!exit.exited) {
  main()
}

if (args.add === 'json') {
  const dir = getWorkingDir()
  const name = 'users'
  const controller = loadTemplate('js/mvc/controller.js')
  const model = loadTemplate('js/mvc/controller.js')
  controller.locals.name = name
  write(path.join(dir, `${name}-route.js`), controller.render())
  write(path.join(dir, `${name}-model.js`), model.render())
  process.exit(0)
}

function createApplication(name, dir) {
  const use = (cb) => {
    app.locals.uses.push(getFuncBody(cb).trim())
  }
  const addImport = (pname, alias = undefined, version = undefined) => {
    const finalName = alias || pname
    addDependency(pkg, pname)
    app.locals.modules[finalName] = pname
  }
  const initApp = (app) => {
    const locals = app.locals
    Object.assign(locals, {
      localModules: Object.create(null),
      modules: Object.create(null),
      mounts: [],
      uses: [],
      args
    })
  }

  const pkg = createPackage(name)
  const app = loadTemplate('js/app.js')
  initApp(app)

  // Request logger
  addImport('morgan', 'logger')
  use((logger) => logger('dev'))

  // Parsers
  use((express) => express.json())
  use((express) => express.urlencoded({ extended: false }))
  addImport('cookie-parser', 'cookieParser')
  use((cookieParser) => cookieParser())
  use((express) => express.static(path.join(__dirname, 'public')))

  if (dir !== '.') {
    mkdir(dir, '.')
  }

  if (args.view) {
    mkdir(dir, 'views')
    copyTemplateMulti('views', `${dir}/views`, '*.ejs')
    app.locals.view = { engine: 'ejs' }
    addDependency(pkg, 'ejs')
  }

  write(path.join(dir, 'app.js'), app.render())
  write(path.join(dir, 'package.json'), prettyJson(pkg))
  // copy assets
  copyTemplate('js/gitignore', path.join(dir, '.gitignore'))
  copyTemplate('js/jest.config.js', path.join(dir, 'jest.config.js'))

  console.log(getFinalPrompt(dir))
}

function main() {
  const destinationPath = getWorkingDir()
  const appName = createAppName(destinationPath) || 'hello-world'
  args.view = args.view === true ? 'ejs' : undefined

  emptyDirectory(destinationPath, (empty) => {
    const newApp = () => createApplication(appName, destinationPath)
    if (empty || args.force) {
      newApp()
    } else {
      confirm('???OVERWRITE???? [y/N] ', (ok) => {
        if (ok) {
          process.stdin.destroy()
          newApp()
        } else {
          console.error('ABORTING')
          exit(1)
        }
      })
    }
  })
}
