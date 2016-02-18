
suite('server test', async function() {
  const proxyServer = require('../server');
  const http = require('http');
  const assert = require('assert');

  const port = 3000;

  let server;

  setup(async function() {
    server = await proxyServer.run(port);
  });

  teardown(async function() {
    await new Promise(accept => server.close(accept));
  });

  function makeRequest(options, headers = {'Content-type': 'application/json'}) {
    return new Promise(function(accept, reject) {
      let request = http.request({
        hostname: 'localhost',
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

  test('no url supplied', function() {
    makeRequest({port: 80}).then(res => {
      assert.equal(res.statusCode, 400);
    });
  });

  test('invalid parameter supplied', function() {
    makeRequest({
      url: 'http://www.mozila.org',
      port: '80'
    }).then(res => {
      assert.equal(res.statusCode, 400);
    });

  });

  test('no content-type header', function() {
    let res = makeRequest({
      url: 'http://www.mozila.org',
    }, {}).then(res => {
      assert.equal(res.statusCode, 400);
    });
  });

  test('invalid content-type value', function() {
    makeRequest({
      url: 'http://www.mozila.org',
    }, {'Content-type': 'text/plain'}).then(res => {
      assert.equal(res.statusCode, 400);
    });
  });

  test('make a valid http request', function() {
    makeRequest({
      url: 'http://tools.taskcluster.net'
    }).then(res => {
      assert.equal(res.statusCode, 302);
    });
  });

  test('make a valid https request', function() {
    makeRequest({
      url: 'https://queue.taskcluster.net/v1/ping'
    }).then(res => {
      let text = '';

      res.on('data', chunk => {
        text += chunk;
      });

      res.on('end', () => {
        const json = JSON.parse(text);
        assert.ok(json.alive !== undefined);
        assert.ok(json.uptime !== undefined);
      });
    });
  });
});
