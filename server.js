var express = require('express');
var app = express();
app.set('x-powered-by', false);
app.use(function(req, res, next) {
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  next();
});
app.use(express.static('dist/tnphr'));
app.get('/', function (req, res,next) {
    res.redirect('/');
});
app.listen(8080);