
const createPackage = (name, port = '8080', mainFile = 'app.js') => ({
  name,
  version: '0.0.0',
  private: true,
  scripts: {
    '_start': `PORT=${port} node ${mainFile}`,
    'start': `PORT=${port} nodemon ${mainFile}`,
    'watch:win': `SET PORT=${port} & nodemon ${mainFile}`,
    'watch:nix': `PORT=${port} nodemon ${mainFile}`,
    debug: `node --inspect --debug-brk ${mainFile}`

  },
  dependencies: {
    'debug': '~2.6.9',
    'express': '~4.16.1',
    'cookie-parser': '^1.4.5'
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
