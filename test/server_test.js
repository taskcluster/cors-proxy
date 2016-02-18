
suite('server test', async function() {
  const proxyServer = require('../server');
  const http = require('http');
  const assert = require('assert');

  const httpPort = 3000;
  const httpsPort = 3001;

  const protocols = [
    {
      protocol: http,
      port: httpPort
    },
  ];

  let servers;

  setup(async function() {
    servers = await proxyServer.run(httpPort, httpsPort);
  });

  teardown(function() {
    for (let server of servers) {
      server.close();
    }
  });

  function makeRequest(options, http, port, headers = {'Content-type': 'application/json'}) {
    return new Promise(function(accept, reject) {
      let request = http.request({
        hostname: 'localhost',
        port,
        path: '/request',
        method: 'POST',
      }, function(req, res) {
        debug(`Request to ${options.hostname} return ${res.status}`);
        accept(res);
      });

      request.on('error', reject);
      request.write(JSON.stringify(options));
      request.end();
    }).catch(err => {
      asssert.ok(false, err);
    });
  }

  for (let {protocol, port} of protocols) {
    test('no hostname supplied', function() {
      makeRequest({port: 80}, protocol, port).then(res => {
        assert.equal(res.statusCode, 400);
      });
    });

    test('invalid parameter supplied', function() {
      makeRequest({
        hostname: 'www.mozila.org',
        port: '80'
      }, protocol, port).then(res => {
        assert.equal(res.statusCode, 400);
      });

    });

    test('no content-type header', function() {
      let res = makeRequest({
        hostname: 'www.mozila.org',
      }, protocol, port, {}).then(res => {
        assert.equal(res.statusCode, 400);
      });
    });

    test('invalid content-type value', function() {
      makeRequest({
        hostname: 'www.mozila.org',
      }, protocol, port, {'Content-type': 'text/plain'}).then(res => {
        assert.equal(res.statusCode, 400);
      });
    });
  }

  test('make a valid http request', function() {
    makeRequest({
      hostname: 'tools.taskcluster.net'
    }, http, httpPort).then(res => {
      assert.equal(res.statusCode, 302);
    });
  });
});
