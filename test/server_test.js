suite('server test', async function() {
  const http = require('http');
  const assert = require('assert');
  const helper = require('./helper');
  const Entities = require('html-entities').AllHtmlEntities;

  const entities = new Entities();

  function  makeRequest(options, headers = {'Content-type': 'application/json'}) {
    headers = Object.assign({}, headers, {Origin: 'http://localhost'});
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

  function getBody(res) {
    return new Promise(function(accept, reject) {
      let body = '';

      res.on('end', () => accept(body));
      res.on('error', reject);

      res.on('data', chunk => {
        body += chunk;
      });
    }).then(body => entities.decode(body));
  }

  test('no url supplied', async function() {
    let res = await makeRequest({port: 80});
    assert.equal(res.statusCode, 400);

    const body = await getBody(res);
    assert.ok(body.includes('\\"url\\" is required'));
  });

  test('invalid parameter supplied', async function() {
    let res = await makeRequest({
      url: `http://localhost:${helper.HTTP_PORT}`,
      method: 'INVALID_METHOD'
    });
    assert.equal(res.statusCode, 400);

    const body = await getBody(res);
    assert.ok(body.includes('\\"method\\" must be one'));
  });

  test('no content-type header', async function() {
    const res = await makeRequest({
      url: `http://localhost:${helper.HTTP_PORT}`,
    }, {});
    assert.equal(res.statusCode, 400);

    const body = await getBody(res);
    assert.ok(body.includes('\\"content-type\\" is required'));
  });

  test('invalid content-type value', async function() {
    const res = await makeRequest({
      url: `http://localhost:${helper.HTTP_PORT}`,
    }, {'Content-type': 'text/plain'});
    assert.equal(res.statusCode, 400);

    const body = await getBody(res);
    assert.ok(body.includes('\\"content-type\\" must be one'));
  });

  test('preflight request', async function() {
    const res = await new Promise(function(accept, reject) {
      const req = http.request({
        host: 'localhost',
        port: helper.PORT,
        path: '/request',
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost',
          'Access-Control-Request-Headers': 'X-Custom-Header'
        }
      }, accept);

      req.on('error', reject);
      req.end();
    });

    assert.equal(res.headers['access-control-allow-origin'], '*');
    assert.equal(res.headers['access-control-allow-headers'], 'X-Custom-Header');
  });

  test('make a valid http request', async function() {
    const res = await makeRequest({
      url: `http://localhost:${helper.HTTP_PORT}`,
    });

    assert.equal(res.statusCode, 200);
    assert.equal('Hello World', await getBody(res));
  });

  test('make a valid https request', async function() {
    const res = await makeRequest({
      url: `https://localhost:${helper.HTTPS_PORT}`,
      rejectUnauthorized: false
    });

    assert.equal(res.statusCode, 200);
    assert.equal('Hello World', await getBody(res));
  });

  test('expose headers', async function() {
    const res = await makeRequest({
      url: `http://localhost:${helper.HTTP_PORT}`,
    }, {
      'Content-Type': 'application/json',
      'X-Cors-Proxy-Expose-Headers': 'X-Header'
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['access-control-expose-headers'], 'X-Header');
  });
});
