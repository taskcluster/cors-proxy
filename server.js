const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const joi = require('joi');
const validate = require('express-validation');
const debug = require('debug')('cors-proxy:server');

// Schema for json request and http headers
const RequestSchema = {
  body: {
    hostname: joi.string().required(),
    path: joi.string().optional(),
    method: joi.string().optional().valid(
      'GET', 'POST', 'DELETE', 'PUT', 'OPTIONS', 'TRACE', 'PATCH'),
    port: joi.number().optional().min(1).max(65535),
    headers: joi.object().optional().pattern(/.+/, joi.string()),
    data: joi.string().optional()
  },
  headers: {
    'content-type': joi.string().required().valid('application/json')
  }
};

// Handle proxy requests
function requestHandler(httpModule) {
  return function(req, res) {
    let request = httpModule.request(req.body, function(requestResponse) {
      const sc = requestResponse.statusCode;

      // if nothing else goes wrong, the status is the same
      // as returned by the remote website
      res.status(sc);

      if (requestResponse.statusCode != 200) {
        debug(`Request to ${req.body.hostname} returned status code ${sc}`);
      }

      res.set(requestResponse.headers);

      // This header will allow sites under taskcluster.net domain
      // to receive the response from the proxy
      res.set('Access-Control-Allow-Origin', 'https://*.taskcluster.net');

      res.on('finish', function() {
        res.end();
      });

      res.on('error', function(err) {
        debug(`Fail to read response: ${err}`);
        res.status(500).json(err);
        res.end();
      });

      requestResponse.pipe(res);
    });

    request.on('error', function(err) {
      res.status(500).json(err);
    });

    if (req.body.data !== undefined) {
      request.write(req.body.data);
    }

    request.end();
  };
}

export function run(httpPort = 80, httpsPort = 443) {
  return new Promise(async function(accept, reject) {
    const app = express();

    app.use(bodyParser.json());
    app.post('/request', validate(RequestSchema), requestHandler(http));
    app.use(function(err, req, res, next) {
      res.status(400).json(err);
    });

    const httpServer = http.createServer(app);

    httpServer.listen(httpPort, () => accept([httpServer]));

    debug('Cors proxy running');
  });
}

if (!module.parent) {
  run(process.env.HTTP_PORT, process.env.HTTPS_PORT).catch(err => {
    console.err(err.stack);
  });
}
