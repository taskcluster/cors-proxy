var http = require('http');
var request = http.request({
  hostname: 'localhost',
  port: 8000,
  path: '/request',
  method: 'POST',
  headers: {
    'Content-type': 'application/xml'
  }
}, function(res) {
  console.log(res.statusCode);
  res.pipe(process.stdout);
});

request.on('error', function(err) {
  console.log(err.stack);
});

request.write(JSON.stringify({
  hostname: 'www.google.com',
  port: 80
}));

request.end();

