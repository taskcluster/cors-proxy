const mocha = require('mocha');
const proxyServer = require('../server');
const fakeWebServer = require('./fake_webserver');
const debug = require('debug')('cors-proxy:mocha');

export const PORT = 3000;
export const HTTP_PORT = 4000;
export const HTTPS_PORT = 5000;

let server;
let webservers;

mocha.before(async function() {
  server = await proxyServer(PORT);
  webservers = await fakeWebServer(HTTP_PORT, HTTPS_PORT);
});

mocha.after(function() {
  server.close();
  for (let webserver of webservers) {
    webserver.close();
  }
});
