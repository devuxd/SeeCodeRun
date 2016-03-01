/* */ 
(function(Buffer) {
  var assert = require('assert-plus');
  var crypto = require('crypto');
  var http = require('http');
  var util = require('util');
  var sshpk = require('sshpk');
  var jsprim = require('jsprim');
  var utils = require('./utils');
  var sprintf = require('util').format;
  var HASH_ALGOS = utils.HASH_ALGOS;
  var PK_ALGOS = utils.PK_ALGOS;
  var InvalidAlgorithmError = utils.InvalidAlgorithmError;
  var HttpSignatureError = utils.HttpSignatureError;
  var validateAlgorithm = utils.validateAlgorithm;
  var AUTHZ_FMT = 'Signature keyId="%s",algorithm="%s",headers="%s",signature="%s"';
  function MissingHeaderError(message) {
    HttpSignatureError.call(this, message, MissingHeaderError);
  }
  util.inherits(MissingHeaderError, HttpSignatureError);
  function StrictParsingError(message) {
    HttpSignatureError.call(this, message, StrictParsingError);
  }
  util.inherits(StrictParsingError, HttpSignatureError);
  function RequestSigner(options) {
    assert.object(options, 'options');
    var alg = [];
    if (options.algorithm !== undefined) {
      assert.string(options.algorithm, 'options.algorithm');
      alg = validateAlgorithm(options.algorithm);
    }
    this.rs_alg = alg;
    if (options.sign !== undefined) {
      assert.func(options.sign, 'options.sign');
      this.rs_signFunc = options.sign;
    } else if (alg[0] === 'hmac' && options.key !== undefined) {
      assert.string(options.keyId, 'options.keyId');
      this.rs_keyId = options.keyId;
      if (typeof(options.key) !== 'string' && !Buffer.isBuffer(options.key))
        throw (new TypeError('options.key for HMAC must be a string or Buffer'));
      this.rs_signer = crypto.createHmac(alg[1].toUpperCase(), options.key);
      this.rs_signer.sign = function() {
        var digest = this.digest('base64');
        return ({
          hashAlgorithm: alg[1],
          toString: function() {
            return (digest);
          }
        });
      };
    } else if (options.key !== undefined) {
      var key = options.key;
      if (typeof(key) === 'string' || Buffer.isBuffer(key))
        key = sshpk.parsePrivateKey(key);
      assert.ok(sshpk.PrivateKey.isPrivateKey(key, [1, 2]), 'options.key must be a sshpk.PrivateKey');
      this.rs_key = key;
      assert.string(options.keyId, 'options.keyId');
      this.rs_keyId = options.keyId;
      if (!PK_ALGOS[key.type]) {
        throw (new InvalidAlgorithmError(key.type.toUpperCase() + ' type ' + 'keys are not supported'));
      }
      if (alg[0] !== undefined && key.type !== alg[0]) {
        throw (new InvalidAlgorithmError('options.key must be a ' + alg[0].toUpperCase() + ' key, was given a ' + key.type.toUpperCase() + ' key instead'));
      }
      this.rs_signer = key.createSign(alg[1]);
    } else {
      throw (new TypeError('options.sign (func) or options.key is required'));
    }
    this.rs_headers = [];
    this.rs_lines = [];
  }
  RequestSigner.prototype.writeHeader = function(header, value) {
    assert.string(header, 'header');
    header = header.toLowerCase();
    assert.string(value, 'value');
    this.rs_headers.push(header);
    if (this.rs_signFunc) {
      this.rs_lines.push(header + ': ' + value);
    } else {
      var line = header + ': ' + value;
      if (this.rs_headers.length > 0)
        line = '\n' + line;
      this.rs_signer.update(line);
    }
    return (value);
  };
  RequestSigner.prototype.writeDateHeader = function() {
    return (this.writeHeader('date', jsprim.rfc1123(new Date())));
  };
  RequestSigner.prototype.writeTarget = function(method, path) {
    assert.string(method, 'method');
    assert.string(path, 'path');
    method = method.toLowerCase();
    this.writeHeader('(request-target)', method + ' ' + path);
  };
  RequestSigner.prototype.sign = function(cb) {
    assert.func(cb, 'callback');
    if (this.rs_headers.length < 1)
      throw (new Error('At least one header must be signed'));
    var alg,
        authz;
    if (this.rs_signFunc) {
      var data = this.rs_lines.join('\n');
      var self = this;
      this.rs_signFunc(data, function(err, sig) {
        if (err) {
          cb(err);
          return;
        }
        try {
          assert.object(sig, 'signature');
          assert.string(sig.keyId, 'signature.keyId');
          assert.string(sig.algorithm, 'signature.algorithm');
          assert.string(sig.signature, 'signature.signature');
          alg = validateAlgorithm(sig.algorithm);
          authz = sprintf(AUTHZ_FMT, sig.keyId, sig.algorithm, self.rs_headers.join(' '), sig.signature);
        } catch (e) {
          cb(e);
          return;
        }
        cb(null, authz);
      });
    } else {
      try {
        var sigObj = this.rs_signer.sign();
      } catch (e) {
        cb(e);
        return;
      }
      alg = (this.rs_alg[0] || this.rs_key.type) + '-' + sigObj.hashAlgorithm;
      var signature = sigObj.toString();
      authz = sprintf(AUTHZ_FMT, this.rs_keyId, alg, this.rs_headers.join(' '), signature);
      cb(null, authz);
    }
  };
  module.exports = {
    isSigner: function(obj) {
      if (typeof(obj) === 'object' && obj instanceof RequestSigner)
        return (true);
      return (false);
    },
    createSigner: function createSigner(options) {
      return (new RequestSigner(options));
    },
    signRequest: function signRequest(request, options) {
      assert.object(request, 'request');
      assert.object(options, 'options');
      assert.optionalString(options.algorithm, 'options.algorithm');
      assert.string(options.keyId, 'options.keyId');
      assert.optionalArrayOfString(options.headers, 'options.headers');
      assert.optionalString(options.httpVersion, 'options.httpVersion');
      if (!request.getHeader('Date'))
        request.setHeader('Date', jsprim.rfc1123(new Date()));
      if (!options.headers)
        options.headers = ['date'];
      if (!options.httpVersion)
        options.httpVersion = '1.1';
      var alg = [];
      if (options.algorithm) {
        options.algorithm = options.algorithm.toLowerCase();
        alg = validateAlgorithm(options.algorithm);
      }
      var i;
      var stringToSign = '';
      for (i = 0; i < options.headers.length; i++) {
        if (typeof(options.headers[i]) !== 'string')
          throw new TypeError('options.headers must be an array of Strings');
        var h = options.headers[i].toLowerCase();
        if (h === 'request-line') {
          if (!options.strict) {
            stringToSign += request.method + ' ' + request.path + ' HTTP/' + options.httpVersion;
          } else {
            throw (new StrictParsingError('request-line is not a valid header ' + 'with strict parsing enabled.'));
          }
        } else if (h === '(request-target)') {
          stringToSign += '(request-target): ' + request.method.toLowerCase() + ' ' + request.path;
        } else {
          var value = request.getHeader(h);
          if (value === undefined || value === '') {
            throw new MissingHeaderError(h + ' was not in the request');
          }
          stringToSign += h + ': ' + value;
        }
        if ((i + 1) < options.headers.length)
          stringToSign += '\n';
      }
      if (request.hasOwnProperty('_stringToSign')) {
        request._stringToSign = stringToSign;
      }
      var signature;
      if (alg[0] === 'hmac') {
        if (typeof(options.key) !== 'string' && !Buffer.isBuffer(options.key))
          throw (new TypeError('options.key must be a string or Buffer'));
        var hmac = crypto.createHmac(alg[1].toUpperCase(), options.key);
        hmac.update(stringToSign);
        signature = hmac.digest('base64');
      } else {
        var key = options.key;
        if (typeof(key) === 'string' || Buffer.isBuffer(key))
          key = sshpk.parsePrivateKey(options.key);
        assert.ok(sshpk.PrivateKey.isPrivateKey(key, [1, 2]), 'options.key must be a sshpk.PrivateKey');
        if (!PK_ALGOS[key.type]) {
          throw (new InvalidAlgorithmError(key.type.toUpperCase() + ' type ' + 'keys are not supported'));
        }
        if (alg[0] !== undefined && key.type !== alg[0]) {
          throw (new InvalidAlgorithmError('options.key must be a ' + alg[0].toUpperCase() + ' key, was given a ' + key.type.toUpperCase() + ' key instead'));
        }
        var signer = key.createSign(alg[1]);
        signer.update(stringToSign);
        var sigObj = signer.sign();
        if (!HASH_ALGOS[sigObj.hashAlgorithm]) {
          throw (new InvalidAlgorithmError(sigObj.hashAlgorithm.toUpperCase() + ' is not a supported hash algorithm'));
        }
        options.algorithm = key.type + '-' + sigObj.hashAlgorithm;
        signature = sigObj.toString();
        assert.notStrictEqual(signature, '', 'empty signature produced');
      }
      request.setHeader('Authorization', sprintf(AUTHZ_FMT, options.keyId, options.algorithm, options.headers.join(' '), signature));
      return true;
    }
  };
})(require('buffer').Buffer);
