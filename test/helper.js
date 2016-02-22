const mocha = require('mocha');
const proxyServer = require('../server');

export const PORT = 3000;

let server;

mocha.before(async function() {
  server = await proxyServer.run(PORT);
});

mocha.after(function() {
  server.close();
});
