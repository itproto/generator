module.exports = require('express').Router()
  .use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: 'SEC' }))
  .get('/svg-captcha', function (req, res) {
    var captcha = require('svg-captcha').create()
    req.session.captcha = captcha.text
    res.type('svg')
    res
      .set('captcha', captcha.text)
      .status(200).send(captcha.data)
  })
  .get('/rate-limit', require('express-rate-limit')({
    windowMs: 10 * 1000,
    max: 3
  }), (req, res) => res.send('Limited'))

if (process.env.JEST_WORKER_ID !== undefined) {
  const request = require('supertest')(app)
  describe('test', () => {
    it('GET / - saluts you', (done) => {
      request
        .get('/rate-limit')
        .retry(5)
        .expect(/Limited/, done)
    })
  })
}
