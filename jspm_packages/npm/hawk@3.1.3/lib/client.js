/* */ 
var Url = require('url');
var Hoek = require('hoek');
var Cryptiles = require('cryptiles');
var Crypto = require('./crypto');
var Utils = require('./utils');
var internals = {};
exports.header = function(uri, method, options) {
  var result = {
    field: '',
    artifacts: {}
  };
  if (!uri || (typeof uri !== 'string' && typeof uri !== 'object') || !method || typeof method !== 'string' || !options || typeof options !== 'object') {
    result.err = 'Invalid argument type';
    return result;
  }
  var timestamp = options.timestamp || Utils.nowSecs(options.localtimeOffsetMsec);
  var credentials = options.credentials;
  if (!credentials || !credentials.id || !credentials.key || !credentials.algorithm) {
    result.err = 'Invalid credential object';
    return result;
  }
  if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
    result.err = 'Unknown algorithm';
    return result;
  }
  if (typeof uri === 'string') {
    uri = Url.parse(uri);
  }
  var artifacts = {
    ts: timestamp,
    nonce: options.nonce || Cryptiles.randomString(6),
    method: method,
    resource: uri.pathname + (uri.search || ''),
    host: uri.hostname,
    port: uri.port || (uri.protocol === 'http:' ? 80 : 443),
    hash: options.hash,
    ext: options.ext,
    app: options.app,
    dlg: options.dlg
  };
  result.artifacts = artifacts;
  if (!artifacts.hash && (options.payload || options.payload === '')) {
    artifacts.hash = Crypto.calculatePayloadHash(options.payload, credentials.algorithm, options.contentType);
  }
  var mac = Crypto.calculateMac('header', credentials, artifacts);
  var hasExt = artifacts.ext !== null && artifacts.ext !== undefined && artifacts.ext !== '';
  var header = 'Hawk id="' + credentials.id + '", ts="' + artifacts.ts + '", nonce="' + artifacts.nonce + (artifacts.hash ? '", hash="' + artifacts.hash : '') + (hasExt ? '", ext="' + Hoek.escapeHeaderAttribute(artifacts.ext) : '') + '", mac="' + mac + '"';
  if (artifacts.app) {
    header += ', app="' + artifacts.app + (artifacts.dlg ? '", dlg="' + artifacts.dlg : '') + '"';
  }
  result.field = header;
  return result;
};
exports.authenticate = function(res, credentials, artifacts, options) {
  artifacts = Hoek.clone(artifacts);
  options = options || {};
  if (res.headers['www-authenticate']) {
    var wwwAttributes = Utils.parseAuthorizationHeader(res.headers['www-authenticate'], ['ts', 'tsm', 'error']);
    if (wwwAttributes instanceof Error) {
      return false;
    }
    if (wwwAttributes.ts) {
      var tsm = Crypto.calculateTsMac(wwwAttributes.ts, credentials);
      if (tsm !== wwwAttributes.tsm) {
        return false;
      }
    }
  }
  if (!res.headers['server-authorization'] && !options.required) {
    return true;
  }
  var attributes = Utils.parseAuthorizationHeader(res.headers['server-authorization'], ['mac', 'ext', 'hash']);
  if (attributes instanceof Error) {
    return false;
  }
  artifacts.ext = attributes.ext;
  artifacts.hash = attributes.hash;
  var mac = Crypto.calculateMac('response', credentials, artifacts);
  if (mac !== attributes.mac) {
    return false;
  }
  if (!options.payload && options.payload !== '') {
    return true;
  }
  if (!attributes.hash) {
    return false;
  }
  var calculatedHash = Crypto.calculatePayloadHash(options.payload, credentials.algorithm, res.headers['content-type']);
  return (calculatedHash === attributes.hash);
};
exports.getBewit = function(uri, options) {
  if (!uri || (typeof uri !== 'string' && typeof uri !== 'object') || !options || typeof options !== 'object' || !options.ttlSec) {
    return '';
  }
  options.ext = (options.ext === null || options.ext === undefined ? '' : options.ext);
  var now = Utils.now(options.localtimeOffsetMsec);
  var credentials = options.credentials;
  if (!credentials || !credentials.id || !credentials.key || !credentials.algorithm) {
    return '';
  }
  if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
    return '';
  }
  if (typeof uri === 'string') {
    uri = Url.parse(uri);
  }
  var exp = Math.floor(now / 1000) + options.ttlSec;
  var mac = Crypto.calculateMac('bewit', credentials, {
    ts: exp,
    nonce: '',
    method: 'GET',
    resource: uri.pathname + (uri.search || ''),
    host: uri.hostname,
    port: uri.port || (uri.protocol === 'http:' ? 80 : 443),
    ext: options.ext
  });
  var bewit = credentials.id + '\\' + exp + '\\' + mac + '\\' + options.ext;
  return Hoek.base64urlEncode(bewit);
};
exports.message = function(host, port, message, options) {
  if (!host || typeof host !== 'string' || !port || typeof port !== 'number' || message === null || message === undefined || typeof message !== 'string' || !options || typeof options !== 'object') {
    return null;
  }
  var timestamp = options.timestamp || Utils.nowSecs(options.localtimeOffsetMsec);
  var credentials = options.credentials;
  if (!credentials || !credentials.id || !credentials.key || !credentials.algorithm) {
    return null;
  }
  if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
    return null;
  }
  var artifacts = {
    ts: timestamp,
    nonce: options.nonce || Cryptiles.randomString(6),
    host: host,
    port: port,
    hash: Crypto.calculatePayloadHash(message, credentials.algorithm)
  };
  var result = {
    id: credentials.id,
    ts: artifacts.ts,
    nonce: artifacts.nonce,
    hash: artifacts.hash,
    mac: Crypto.calculateMac('message', credentials, artifacts)
  };
  return result;
};
