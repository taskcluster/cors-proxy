const express = require('express');
const morganDebug = require('morgan-debug');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

export default function fakeWebServer(httpPort, httpsPort) {
  let retStatus = 200;
  const app = express();

  app.use('/', function(req, res) {
    res.set('X-Fake-Server-Request-Method', req.method);
    res.set('X-Fake-Server-Request-Path', req.path);
    res.write('Hello World');

    if (req.headers['X-Fake-Server-Status']) {
      retStatus = parseInt(req.headers['X-Fake-Server-Status'], 10);
    }

    res.status(retStatus).end();
  });

  const httpServer = http.createServer(app);

  const httpsServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'fixtures', 'ssl_cert.key')),
    cert: fs.readFileSync(path.join(__dirname, 'fixtures', 'ssl_cert.crt'))
  }, app);

  return Promise.all([
    new Promise(function(accept) {
      httpServer.listen(httpPort, () => accept(httpServer));
    }),
    new Promise(function(accept) {
      httpsServer.listen(httpsPort, () => accept(httpsServer));
    })
  ]);
}

if (!module.parent) {
  try {
    fakeWebServer(10000, 11000).catch(err => console.log(err.stack));
  } catch (err) {
    console.log(err.stack);
  }
}
