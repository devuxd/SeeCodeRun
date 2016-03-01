/* */ 
(function(process) {
  var Boom = require('boom');
  var Hoek = require('hoek');
  var Cryptiles = require('cryptiles');
  var Crypto = require('./crypto');
  var Utils = require('./utils');
  var internals = {};
  exports.authenticate = function(req, credentialsFunc, options, callback) {
    callback = Hoek.nextTick(callback);
    options.nonceFunc = options.nonceFunc || internals.nonceFunc;
    options.timestampSkewSec = options.timestampSkewSec || 60;
    var now = Utils.now(options.localtimeOffsetMsec);
    var request = Utils.parseRequest(req, options);
    if (request instanceof Error) {
      return callback(Boom.badRequest(request.message));
    }
    var attributes = Utils.parseAuthorizationHeader(request.authorization);
    if (attributes instanceof Error) {
      return callback(attributes);
    }
    var artifacts = {
      method: request.method,
      host: request.host,
      port: request.port,
      resource: request.url,
      ts: attributes.ts,
      nonce: attributes.nonce,
      hash: attributes.hash,
      ext: attributes.ext,
      app: attributes.app,
      dlg: attributes.dlg,
      mac: attributes.mac,
      id: attributes.id
    };
    if (!attributes.id || !attributes.ts || !attributes.nonce || !attributes.mac) {
      return callback(Boom.badRequest('Missing attributes'), null, artifacts);
    }
    credentialsFunc(attributes.id, function(err, credentials) {
      if (err) {
        return callback(err, credentials || null, artifacts);
      }
      if (!credentials) {
        return callback(Boom.unauthorized('Unknown credentials', 'Hawk'), null, artifacts);
      }
      if (!credentials.key || !credentials.algorithm) {
        return callback(Boom.internal('Invalid credentials'), credentials, artifacts);
      }
      if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
        return callback(Boom.internal('Unknown algorithm'), credentials, artifacts);
      }
      var mac = Crypto.calculateMac('header', credentials, artifacts);
      if (!Cryptiles.fixedTimeComparison(mac, attributes.mac)) {
        return callback(Boom.unauthorized('Bad mac', 'Hawk'), credentials, artifacts);
      }
      if (options.payload || options.payload === '') {
        if (!attributes.hash) {
          return callback(Boom.unauthorized('Missing required payload hash', 'Hawk'), credentials, artifacts);
        }
        var hash = Crypto.calculatePayloadHash(options.payload, credentials.algorithm, request.contentType);
        if (!Cryptiles.fixedTimeComparison(hash, attributes.hash)) {
          return callback(Boom.unauthorized('Bad payload hash', 'Hawk'), credentials, artifacts);
        }
      }
      options.nonceFunc(credentials.key, attributes.nonce, attributes.ts, function(err) {
        if (err) {
          return callback(Boom.unauthorized('Invalid nonce', 'Hawk'), credentials, artifacts);
        }
        if (Math.abs((attributes.ts * 1000) - now) > (options.timestampSkewSec * 1000)) {
          var tsm = Crypto.timestampMessage(credentials, options.localtimeOffsetMsec);
          return callback(Boom.unauthorized('Stale timestamp', 'Hawk', tsm), credentials, artifacts);
        }
        return callback(null, credentials, artifacts);
      });
    });
  };
  exports.authenticatePayload = function(payload, credentials, artifacts, contentType) {
    var calculatedHash = Crypto.calculatePayloadHash(payload, credentials.algorithm, contentType);
    return Cryptiles.fixedTimeComparison(calculatedHash, artifacts.hash);
  };
  exports.authenticatePayloadHash = function(calculatedHash, artifacts) {
    return Cryptiles.fixedTimeComparison(calculatedHash, artifacts.hash);
  };
  exports.header = function(credentials, artifacts, options) {
    options = options || {};
    if (!artifacts || typeof artifacts !== 'object' || typeof options !== 'object') {
      return '';
    }
    artifacts = Hoek.clone(artifacts);
    delete artifacts.mac;
    artifacts.hash = options.hash;
    artifacts.ext = options.ext;
    if (!credentials || !credentials.key || !credentials.algorithm) {
      return '';
    }
    if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
      return '';
    }
    if (!artifacts.hash && (options.payload || options.payload === '')) {
      artifacts.hash = Crypto.calculatePayloadHash(options.payload, credentials.algorithm, options.contentType);
    }
    var mac = Crypto.calculateMac('response', credentials, artifacts);
    var header = 'Hawk mac="' + mac + '"' + (artifacts.hash ? ', hash="' + artifacts.hash + '"' : '');
    if (artifacts.ext !== null && artifacts.ext !== undefined && artifacts.ext !== '') {
      header += ', ext="' + Hoek.escapeHeaderAttribute(artifacts.ext) + '"';
    }
    return header;
  };
  internals.bewitRegex = /^(\/.*)([\?&])bewit\=([^&$]*)(?:&(.+))?$/;
  exports.authenticateBewit = function(req, credentialsFunc, options, callback) {
    callback = Hoek.nextTick(callback);
    var now = Utils.now(options.localtimeOffsetMsec);
    var request = Utils.parseRequest(req, options);
    if (request instanceof Error) {
      return callback(Boom.badRequest(request.message));
    }
    if (request.url.length > Utils.limits.maxMatchLength) {
      return callback(Boom.badRequest('Resource path exceeds max length'));
    }
    var resource = request.url.match(internals.bewitRegex);
    if (!resource) {
      return callback(Boom.unauthorized(null, 'Hawk'));
    }
    if (!resource[3]) {
      return callback(Boom.unauthorized('Empty bewit', 'Hawk'));
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return callback(Boom.unauthorized('Invalid method', 'Hawk'));
    }
    if (request.authorization) {
      return callback(Boom.badRequest('Multiple authentications'));
    }
    var bewitString = Hoek.base64urlDecode(resource[3]);
    if (bewitString instanceof Error) {
      return callback(Boom.badRequest('Invalid bewit encoding'));
    }
    var bewitParts = bewitString.split('\\');
    if (bewitParts.length !== 4) {
      return callback(Boom.badRequest('Invalid bewit structure'));
    }
    var bewit = {
      id: bewitParts[0],
      exp: parseInt(bewitParts[1], 10),
      mac: bewitParts[2],
      ext: bewitParts[3] || ''
    };
    if (!bewit.id || !bewit.exp || !bewit.mac) {
      return callback(Boom.badRequest('Missing bewit attributes'));
    }
    var url = resource[1];
    if (resource[4]) {
      url += resource[2] + resource[4];
    }
    if (bewit.exp * 1000 <= now) {
      return callback(Boom.unauthorized('Access expired', 'Hawk'), null, bewit);
    }
    credentialsFunc(bewit.id, function(err, credentials) {
      if (err) {
        return callback(err, credentials || null, bewit.ext);
      }
      if (!credentials) {
        return callback(Boom.unauthorized('Unknown credentials', 'Hawk'), null, bewit);
      }
      if (!credentials.key || !credentials.algorithm) {
        return callback(Boom.internal('Invalid credentials'), credentials, bewit);
      }
      if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
        return callback(Boom.internal('Unknown algorithm'), credentials, bewit);
      }
      var mac = Crypto.calculateMac('bewit', credentials, {
        ts: bewit.exp,
        nonce: '',
        method: 'GET',
        resource: url,
        host: request.host,
        port: request.port,
        ext: bewit.ext
      });
      if (!Cryptiles.fixedTimeComparison(mac, bewit.mac)) {
        return callback(Boom.unauthorized('Bad mac', 'Hawk'), credentials, bewit);
      }
      return callback(null, credentials, bewit);
    });
  };
  exports.authenticateMessage = function(host, port, message, authorization, credentialsFunc, options, callback) {
    callback = Hoek.nextTick(callback);
    options.nonceFunc = options.nonceFunc || internals.nonceFunc;
    options.timestampSkewSec = options.timestampSkewSec || 60;
    var now = Utils.now(options.localtimeOffsetMsec);
    if (!authorization.id || !authorization.ts || !authorization.nonce || !authorization.hash || !authorization.mac) {
      return callback(Boom.badRequest('Invalid authorization'));
    }
    credentialsFunc(authorization.id, function(err, credentials) {
      if (err) {
        return callback(err, credentials || null);
      }
      if (!credentials) {
        return callback(Boom.unauthorized('Unknown credentials', 'Hawk'));
      }
      if (!credentials.key || !credentials.algorithm) {
        return callback(Boom.internal('Invalid credentials'), credentials);
      }
      if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
        return callback(Boom.internal('Unknown algorithm'), credentials);
      }
      var artifacts = {
        ts: authorization.ts,
        nonce: authorization.nonce,
        host: host,
        port: port,
        hash: authorization.hash
      };
      var mac = Crypto.calculateMac('message', credentials, artifacts);
      if (!Cryptiles.fixedTimeComparison(mac, authorization.mac)) {
        return callback(Boom.unauthorized('Bad mac', 'Hawk'), credentials);
      }
      var hash = Crypto.calculatePayloadHash(message, credentials.algorithm);
      if (!Cryptiles.fixedTimeComparison(hash, authorization.hash)) {
        return callback(Boom.unauthorized('Bad message hash', 'Hawk'), credentials);
      }
      options.nonceFunc(credentials.key, authorization.nonce, authorization.ts, function(err) {
        if (err) {
          return callback(Boom.unauthorized('Invalid nonce', 'Hawk'), credentials);
        }
        if (Math.abs((authorization.ts * 1000) - now) > (options.timestampSkewSec * 1000)) {
          return callback(Boom.unauthorized('Stale timestamp'), credentials);
        }
        return callback(null, credentials);
      });
    });
  };
  internals.nonceFunc = function(key, nonce, ts, nonceCallback) {
    return nonceCallback();
  };
})(require('process'));
