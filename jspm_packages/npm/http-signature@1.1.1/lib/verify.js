/* */ 
(function(Buffer) {
  var assert = require('assert-plus');
  var crypto = require('crypto');
  var sshpk = require('sshpk');
  var utils = require('./utils');
  var HASH_ALGOS = utils.HASH_ALGOS;
  var PK_ALGOS = utils.PK_ALGOS;
  var InvalidAlgorithmError = utils.InvalidAlgorithmError;
  var HttpSignatureError = utils.HttpSignatureError;
  var validateAlgorithm = utils.validateAlgorithm;
  module.exports = {
    verifySignature: function verifySignature(parsedSignature, pubkey) {
      assert.object(parsedSignature, 'parsedSignature');
      if (typeof(pubkey) === 'string' || Buffer.isBuffer(pubkey))
        pubkey = sshpk.parseKey(pubkey);
      assert.ok(sshpk.Key.isKey(pubkey, [1, 1]), 'pubkey must be a sshpk.Key');
      var alg = validateAlgorithm(parsedSignature.algorithm);
      if (alg[0] === 'hmac' || alg[0] !== pubkey.type)
        return (false);
      var v = pubkey.createVerify(alg[1]);
      v.update(parsedSignature.signingString);
      return (v.verify(parsedSignature.params.signature, 'base64'));
    },
    verifyHMAC: function verifyHMAC(parsedSignature, secret) {
      assert.object(parsedSignature, 'parsedHMAC');
      assert.string(secret, 'secret');
      var alg = validateAlgorithm(parsedSignature.algorithm);
      if (alg[0] !== 'hmac')
        return (false);
      var hashAlg = alg[1].toUpperCase();
      var hmac = crypto.createHmac(hashAlg, secret);
      hmac.update(parsedSignature.signingString);
      var h1 = crypto.createHmac(hashAlg, secret);
      h1.update(hmac.digest());
      h1 = h1.digest();
      var h2 = crypto.createHmac(hashAlg, secret);
      h2.update(new Buffer(parsedSignature.params.signature, 'base64'));
      h2 = h2.digest();
      if (typeof(h1) === 'string')
        return (h1 === h2);
      if (Buffer.isBuffer(h1) && !h1.equals)
        return (h1.toString('binary') === h2.toString('binary'));
      return (h1.equals(h2));
    }
  };
})(require('buffer').Buffer);
