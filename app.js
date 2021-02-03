

const app = module.exports = require('express')()
  .set('port', process.env.PORT || 5555)
  .get('/', (req, res) => (res.end('Sample')))
  .get('/json', (req, res) => res.json({ ok: 'ok' }))
  .get('/headers', (req, res) => JSON.stringify(res.getHeaders(), null, 2))


if (require.main === module) {

   // sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key -out selfsigned.crt
  const fs = require('fs');
  const { join } = require('path');
  const key = fs.readFileSync(join(__dirname, '.cert/selfsigned.key'), 'utf8');
  const cert = fs.readFileSync(join(__dirname, '.cert/selfsigned.crt'), 'utf8');
  const serv = require('https').createServer({ key, cert }, app);

  serv.listen(app.get('port'),
      () => console.log(`listen http://localhost:${JSON.stringify(serv.address().port)}`)
  );
}

