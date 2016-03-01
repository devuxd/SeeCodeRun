/* */ 
var Crypto = require('crypto');
var Url = require('url');
var Utils = require('./utils');
var internals = {};
exports.headerVersion = '1';
exports.algorithms = ['sha1', 'sha256'];
exports.calculateMac = function(type, credentials, options) {
  var normalized = exports.generateNormalizedString(type, options);
  var hmac = Crypto.createHmac(credentials.algorithm, credentials.key).update(normalized);
  var digest = hmac.digest('base64');
  return digest;
};
exports.generateNormalizedString = function(type, options) {
  var resource = options.resource || '';
  if (resource && resource[0] !== '/') {
    var url = Url.parse(resource, false);
    resource = url.path;
  }
  var normalized = 'hawk.' + exports.headerVersion + '.' + type + '\n' + options.ts + '\n' + options.nonce + '\n' + (options.method || '').toUpperCase() + '\n' + resource + '\n' + options.host.toLowerCase() + '\n' + options.port + '\n' + (options.hash || '') + '\n';
  if (options.ext) {
    normalized += options.ext.replace('\\', '\\\\').replace('\n', '\\n');
  }
  normalized += '\n';
  if (options.app) {
    normalized += options.app + '\n' + (options.dlg || '') + '\n';
  }
  return normalized;
};
exports.calculatePayloadHash = function(payload, algorithm, contentType) {
  var hash = exports.initializePayloadHash(algorithm, contentType);
  hash.update(payload || '');
  return exports.finalizePayloadHash(hash);
};
exports.initializePayloadHash = function(algorithm, contentType) {
  var hash = Crypto.createHash(algorithm);
  hash.update('hawk.' + exports.headerVersion + '.payload\n');
  hash.update(Utils.parseContentType(contentType) + '\n');
  return hash;
};
exports.finalizePayloadHash = function(hash) {
  hash.update('\n');
  return hash.digest('base64');
};
exports.calculateTsMac = function(ts, credentials) {
  var hmac = Crypto.createHmac(credentials.algorithm, credentials.key);
  hmac.update('hawk.' + exports.headerVersion + '.ts\n' + ts + '\n');
  return hmac.digest('base64');
};
exports.timestampMessage = function(credentials, localtimeOffsetMsec) {
  var now = Utils.nowSecs(localtimeOffsetMsec);
  var tsm = exports.calculateTsMac(now, credentials);
  return {
    ts: now,
    tsm: tsm
  };
};
