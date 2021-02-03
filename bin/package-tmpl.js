const createPackage = (name) => ({
  name,
  version: '0.0.0',
  private: true,
  scripts: {
    start: 'SET PORT=7777 && nodemon app.js',
    'start:nix': 'SET PORT=7777 && nodemon app.js',
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

const additionalDepds = {
  'morgan': '~1.9.1',
  'cookie-parser': '~1.4.4',
  'ejs': '~2.6.1'
}

const addDependency = (pkg, name, version = undefined) => {
  const pkgVersion = version || additionalDepds[name] || '*'
  pkg.dependencies[name] = pkgVersion
  return pkg
}

module.exports = {
  createPackage,
  addDependency
}
