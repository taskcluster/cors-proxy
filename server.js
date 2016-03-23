const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const urlParse = require('url').parse;
const joi = require('joi');
const validate = require('express-validation');
const sslify = require('express-sslify');
const debug = require('debug')('cors-proxy:server');
const morganDebug = require('morgan-debug');

const ORIGIN_WHITELIST = [
  'tools.taskcluster.net',
  'status.taskcluster.net'
];

const NODE_ENV = process.env.NODE_ENV || 'developemnt';

// Schema for json request and http headers
const RequestSchema = {
  body: {
    url: joi.string().uri().required(),
    method: joi.string().optional().valid(
      'GET', 'POST', 'DELETE', 'PUT', 'OPTIONS', 'TRACE', 'PATCH'),
    headers: joi.object().optional().pattern(/.+/, joi.string()),
    data: joi.string().allow('').default('').optional(),
    rejectUnauthorized: joi.boolean().optional().default(true)
  },
  headers: {
    origin: joi.string().uri().required(),
    'content-type': joi.string().required().valid('application/json')
  }
};

const PreflightSchema = {
  headers: {
    origin: joi.string().uri().required()
  }
};

export function checkDomain(host) {
  return ORIGIN_WHITELIST.some(domain => domain == host);
}

function setupCORS(req, res) {
  if (NODE_ENV === 'production') {
    const origin = req.headers['Origin'];
    const host = urlParse(origin).host;

    if (!checkDomain(host)) {
      debug(`${origin} is not a valid Taskcluster domain`);
      return;
    }

    res.set('Access-Control-Allow-Origin', origin);
  } else {
    // In development mode, let all request be allowed
    res.set('Access-Control-Allow-Origin', '*');
  }

  res.set('Access-Control-Request-Method',
    'GET POST HEAD OPTIONS PUT DELETE TRACE CONNECT');

  const accessControlRequestHeaders = req.headers['access-control-request-headers'];
  if (accessControlRequestHeaders) {
    res.set('Access-Control-Allow-Headers', accessControlRequestHeaders);
  }

  const exposeHeaders = req.headers['x-cors-proxy-expose-headers'];

  if (exposeHeaders) {
    res.set('Access-Control-Expose-Headers', exposeHeaders);
  }
}

function reportError(res, statusCode, err) {
  debug(err);

  try {
    res.status(statusCode).send(`${err.stack}`);
  } catch (e) {
  }
}

// Handle proxy requests
function requestHandler(req, res) {
  let {
    url,
    rejectUnauthorized,
    method = undefined,
    headers = undefined,
    data = ''
  } = req.body;

  url = urlParse(url);
  const httpModule = url.protocol == 'http:' ? http : https;

  if (!url.search) {
    url.search = '';
  }

  let request = httpModule.request({
    hostname: url.hostname,
    protocol: url.protocol,
    port: url.port,
    path: url.path,
    auth: url.auth,
    rejectUnauthorized,
    method,
    headers,
  }, function(requestResponse) {
    const sc = requestResponse.statusCode;

    // if nothing else goes wrong, the status is the same
    // as returned by the remote website
    res.status(sc);

    if (requestResponse.statusCode != 200) {
      debug(`Request to ${req.body.url} returned status code ${sc}`);
    }

    res.set(requestResponse.headers);
    setupCORS(req, res);

    res.on('finish', function() {
      res.end();
    });

    res.on('error', function(err) {
      reportError(res, 500, err);
    });

    requestResponse.pipe(res);
  });

  request.on('error', function(err) {
    reportError(res, 500, err);
  });

  request.write(req.body.data);
  request.end();
}

export function proxyServer(port = 80) {
  return new Promise(async function(accept, reject) {
    const app = express();

    if (NODE_ENV === 'production') {
      app.use(sslify.HTTPS({trustProtoHeader: true}));
    }

    app.use(morganDebug('cors-proxy:server', 'combined'));
    app.use(bodyParser.json());
    app.post('/request', validate(RequestSchema), requestHandler);

    // preflight request
    app.options('/request', validate(PreflightSchema), function(req, res) {
      setupCORS(req, res);
      res.status(200).end();
    });

    const server = http.createServer(app);

    server.listen(port, () => {
      debug('Cors proxy running');
      accept(server);
    });
  });
}

if (!module.parent) {
  proxyServer(process.env.PORT).catch(err => {
    console.err(err.stack);
  });
}
