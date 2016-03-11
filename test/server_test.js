suite('server test', async function() {
  const http = require('http');
  const assert = require('assert');
  const helper = require('./helper');

  function  makeRequest(options, headers = {'Content-type': 'application/json'}) {
    return new Promise(function(accept, reject) {
      let request = http.request({
        hostname: 'localhost',
        port: helper.PORT,
        path: '/request',
        method: 'POST',
        headers,
      }, function(res) {
        accept(res);
      });

      request.on('error', reject);
      request.write(JSON.stringify(options));
      request.end();
    });
  }

  test('no url supplied', async function() {
    let res = await makeRequest({port: 80});
    assert.equal(res.statusCode, 400);
  });

  test('invalid parameter supplied', async function() {
    let res = await makeRequest({
      url: 'http://www.mozila.org',
      method: 'INVALID_METHOD'
    });
    assert.equal(res.statusCode, 400);
  });

  test('no content-type header', async function() {
    const res = await makeRequest({
      url: 'http://www.mozila.org',
    }, {});
    assert.equal(res.statusCode, 400);
  });

  test('invalid content-type value', async function() {
    const res = await makeRequest({
      url: 'http://www.mozila.org',
    }, {'Content-type': 'text/plain'});
    assert.equal(res.statusCode, 400);
  });

  test('make a valid http request', async function() {
    const res = await makeRequest({
      url: 'http://tools.taskcluster.net'
    });
    assert.equal(res.statusCode, 301);
  });

  test('make a valid https request', async function() {
    const res = await makeRequest({
      url: 'https://queue.taskcluster.net/v1/ping',
      rejectUnauthorized: false
    });

    const jsonReply = await new Promise(function(accept) {
      let text = '';

      res.on('end', () => {
        accept(JSON.parse(text));
      });

      res.on('data', chunk => {
        text += chunk;
      });
    });

    assert.ok(jsonReply.alive !== undefined);
    assert.ok(jsonReply.uptime !== undefined);
  });
});
