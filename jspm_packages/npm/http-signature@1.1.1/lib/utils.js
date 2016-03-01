/* */ 
var assert = require('assert-plus');
var sshpk = require('sshpk');
var util = require('util');
var HASH_ALGOS = {
  'sha1': true,
  'sha256': true,
  'sha512': true
};
var PK_ALGOS = {
  'rsa': true,
  'dsa': true,
  'ecdsa': true
};
function HttpSignatureError(message, caller) {
  if (Error.captureStackTrace)
    Error.captureStackTrace(this, caller || HttpSignatureError);
  this.message = message;
  this.name = caller.name;
}
util.inherits(HttpSignatureError, Error);
function InvalidAlgorithmError(message) {
  HttpSignatureError.call(this, message, InvalidAlgorithmError);
}
util.inherits(InvalidAlgorithmError, HttpSignatureError);
function validateAlgorithm(algorithm) {
  var alg = algorithm.toLowerCase().split('-');
  if (alg.length !== 2) {
    throw (new InvalidAlgorithmError(alg[0].toUpperCase() + ' is not a ' + 'valid algorithm'));
  }
  if (alg[0] !== 'hmac' && !PK_ALGOS[alg[0]]) {
    throw (new InvalidAlgorithmError(alg[0].toUpperCase() + ' type keys ' + 'are not supported'));
  }
  if (!HASH_ALGOS[alg[1]]) {
    throw (new InvalidAlgorithmError(alg[1].toUpperCase() + ' is not a ' + 'supported hash algorithm'));
  }
  return (alg);
}
module.exports = {
  HASH_ALGOS: HASH_ALGOS,
  PK_ALGOS: PK_ALGOS,
  HttpSignatureError: HttpSignatureError,
  InvalidAlgorithmError: InvalidAlgorithmError,
  validateAlgorithm: validateAlgorithm,
  sshKeyToPEM: function sshKeyToPEM(key) {
    assert.string(key, 'ssh_key');
    var k = sshpk.parseKey(key, 'ssh');
    return (k.toString('pem'));
  },
  fingerprint: function fingerprint(key) {
    assert.string(key, 'ssh_key');
    var k = sshpk.parseKey(key, 'ssh');
    return (k.fingerprint('md5').toString('hex'));
  },
  pemToRsaSSHKey: function pemToRsaSSHKey(pem, comment) {
    assert.equal('string', typeof(pem), 'typeof pem');
    var k = sshpk.parseKey(pem, 'pem');
    k.comment = comment;
    return (k.toString('ssh'));
  }
};
