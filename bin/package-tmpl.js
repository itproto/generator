const createPackage = (name) => ({
  name,
  version: '0.0.0',
  private: true,
  scripts: {
    start: 'PORT 7777 nodemon app.js',
    debug: 'node --inspect --debug-brk app.js'

  },
  dependencies: {
    'debug': '~2.6.9',
    'express': '~4.16.1'
  },
  devDependencies: {
    'nodemon': '^2.0.7'
  }
})

const addDependency = (pkg, name, version) => {
  pkg.dependencies[name] = version
  return pkg
}

module.exports = {
  createPackage,
  addDependency
}
