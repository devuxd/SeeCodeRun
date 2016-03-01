/* */ 
var Sntp = require('sntp');
var Boom = require('boom');
var internals = {};
exports.version = function() {
  return require('../package.json!systemjs-json').version;
};
exports.limits = {maxMatchLength: 4096};
internals.hostHeaderRegex = /^(?:(?:\r\n)?\s)*((?:[^:]+)|(?:\[[^\]]+\]))(?::(\d+))?(?:(?:\r\n)?\s)*$/;
exports.parseHost = function(req, hostHeaderName) {
  hostHeaderName = (hostHeaderName ? hostHeaderName.toLowerCase() : 'host');
  var hostHeader = req.headers[hostHeaderName];
  if (!hostHeader) {
    return null;
  }
  if (hostHeader.length > exports.limits.maxMatchLength) {
    return null;
  }
  var hostParts = hostHeader.match(internals.hostHeaderRegex);
  if (!hostParts) {
    return null;
  }
  return {
    name: hostParts[1],
    port: (hostParts[2] ? hostParts[2] : (req.connection && req.connection.encrypted ? 443 : 80))
  };
};
exports.parseContentType = function(header) {
  if (!header) {
    return '';
  }
  return header.split(';')[0].trim().toLowerCase();
};
exports.parseRequest = function(req, options) {
  if (!req.headers) {
    return req;
  }
  var host;
  if (!options.host || !options.port) {
    host = exports.parseHost(req, options.hostHeaderName);
    if (!host) {
      return new Error('Invalid Host header');
    }
  }
  var request = {
    method: req.method,
    url: req.url,
    host: options.host || host.name,
    port: options.port || host.port,
    authorization: req.headers.authorization,
    contentType: req.headers['content-type'] || ''
  };
  return request;
};
exports.now = function(localtimeOffsetMsec) {
  return Sntp.now() + (localtimeOffsetMsec || 0);
};
exports.nowSecs = function(localtimeOffsetMsec) {
  return Math.floor(exports.now(localtimeOffsetMsec) / 1000);
};
internals.authHeaderRegex = /^(\w+)(?:\s+(.*))?$/;
internals.attributeRegex = /^[ \w\!#\$%&'\(\)\*\+,\-\.\/\:;<\=>\?@\[\]\^`\{\|\}~]+$/;
exports.parseAuthorizationHeader = function(header, keys) {
  keys = keys || ['id', 'ts', 'nonce', 'hash', 'ext', 'mac', 'app', 'dlg'];
  if (!header) {
    return Boom.unauthorized(null, 'Hawk');
  }
  if (header.length > exports.limits.maxMatchLength) {
    return Boom.badRequest('Header length too long');
  }
  var headerParts = header.match(internals.authHeaderRegex);
  if (!headerParts) {
    return Boom.badRequest('Invalid header syntax');
  }
  var scheme = headerParts[1];
  if (scheme.toLowerCase() !== 'hawk') {
    return Boom.unauthorized(null, 'Hawk');
  }
  var attributesString = headerParts[2];
  if (!attributesString) {
    return Boom.badRequest('Invalid header syntax');
  }
  var attributes = {};
  var errorMessage = '';
  var verify = attributesString.replace(/(\w+)="([^"\\]*)"\s*(?:,\s*|$)/g, function($0, $1, $2) {
    if (keys.indexOf($1) === -1) {
      errorMessage = 'Unknown attribute: ' + $1;
      return;
    }
    if ($2.match(internals.attributeRegex) === null) {
      errorMessage = 'Bad attribute value: ' + $1;
      return;
    }
    if (attributes.hasOwnProperty($1)) {
      errorMessage = 'Duplicate attribute: ' + $1;
      return;
    }
    attributes[$1] = $2;
    return '';
  });
  if (verify !== '') {
    return Boom.badRequest(errorMessage || 'Bad header format');
  }
  return attributes;
};
exports.unauthorized = function(message, attributes) {
  return Boom.unauthorized(message, 'Hawk', attributes);
};
