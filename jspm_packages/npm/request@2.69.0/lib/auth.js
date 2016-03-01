/* */ 
'use strict';
var caseless = require('caseless'),
    uuid = require('node-uuid'),
    helpers = require('./helpers');
var md5 = helpers.md5,
    toBase64 = helpers.toBase64;
function Auth(request) {
  this.request = request;
  this.hasAuth = false;
  this.sentAuth = false;
  this.bearerToken = null;
  this.user = null;
  this.pass = null;
}
Auth.prototype.basic = function(user, pass, sendImmediately) {
  var self = this;
  if (typeof user !== 'string' || (pass !== undefined && typeof pass !== 'string')) {
    self.request.emit('error', new Error('auth() received invalid user or password'));
  }
  self.user = user;
  self.pass = pass;
  self.hasAuth = true;
  var header = user + ':' + (pass || '');
  if (sendImmediately || typeof sendImmediately === 'undefined') {
    var authHeader = 'Basic ' + toBase64(header);
    self.sentAuth = true;
    return authHeader;
  }
};
Auth.prototype.bearer = function(bearer, sendImmediately) {
  var self = this;
  self.bearerToken = bearer;
  self.hasAuth = true;
  if (sendImmediately || typeof sendImmediately === 'undefined') {
    if (typeof bearer === 'function') {
      bearer = bearer();
    }
    var authHeader = 'Bearer ' + (bearer || '');
    self.sentAuth = true;
    return authHeader;
  }
};
Auth.prototype.digest = function(method, path, authHeader) {
  var self = this;
  var challenge = {};
  var re = /([a-z0-9_-]+)=(?:"([^"]+)"|([a-z0-9_-]+))/gi;
  for (; ; ) {
    var match = re.exec(authHeader);
    if (!match) {
      break;
    }
    challenge[match[1]] = match[2] || match[3];
  }
  var ha1Compute = function(algorithm, user, realm, pass, nonce, cnonce) {
    var ha1 = md5(user + ':' + realm + ':' + pass);
    if (algorithm && algorithm.toLowerCase() === 'md5-sess') {
      return md5(ha1 + ':' + nonce + ':' + cnonce);
    } else {
      return ha1;
    }
  };
  var qop = /(^|,)\s*auth\s*($|,)/.test(challenge.qop) && 'auth';
  var nc = qop && '00000001';
  var cnonce = qop && uuid().replace(/-/g, '');
  var ha1 = ha1Compute(challenge.algorithm, self.user, challenge.realm, self.pass, challenge.nonce, cnonce);
  var ha2 = md5(method + ':' + path);
  var digestResponse = qop ? md5(ha1 + ':' + challenge.nonce + ':' + nc + ':' + cnonce + ':' + qop + ':' + ha2) : md5(ha1 + ':' + challenge.nonce + ':' + ha2);
  var authValues = {
    username: self.user,
    realm: challenge.realm,
    nonce: challenge.nonce,
    uri: path,
    qop: qop,
    response: digestResponse,
    nc: nc,
    cnonce: cnonce,
    algorithm: challenge.algorithm,
    opaque: challenge.opaque
  };
  authHeader = [];
  for (var k in authValues) {
    if (authValues[k]) {
      if (k === 'qop' || k === 'nc' || k === 'algorithm') {
        authHeader.push(k + '=' + authValues[k]);
      } else {
        authHeader.push(k + '="' + authValues[k] + '"');
      }
    }
  }
  authHeader = 'Digest ' + authHeader.join(', ');
  self.sentAuth = true;
  return authHeader;
};
Auth.prototype.onRequest = function(user, pass, sendImmediately, bearer) {
  var self = this,
      request = self.request;
  var authHeader;
  if (bearer === undefined && user === undefined) {
    self.request.emit('error', new Error('no auth mechanism defined'));
  } else if (bearer !== undefined) {
    authHeader = self.bearer(bearer, sendImmediately);
  } else {
    authHeader = self.basic(user, pass, sendImmediately);
  }
  if (authHeader) {
    request.setHeader('authorization', authHeader);
  }
};
Auth.prototype.onResponse = function(response) {
  var self = this,
      request = self.request;
  if (!self.hasAuth || self.sentAuth) {
    return null;
  }
  var c = caseless(response.headers);
  var authHeader = c.get('www-authenticate');
  var authVerb = authHeader && authHeader.split(' ')[0].toLowerCase();
  request.debug('reauth', authVerb);
  switch (authVerb) {
    case 'basic':
      return self.basic(self.user, self.pass, true);
    case 'bearer':
      return self.bearer(self.bearerToken, true);
    case 'digest':
      return self.digest(request.method, request.path, authHeader);
  }
};
exports.Auth = Auth;
