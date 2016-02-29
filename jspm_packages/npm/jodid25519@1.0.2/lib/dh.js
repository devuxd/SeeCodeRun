/* */ 
(function(Buffer) {
  "use strict";
  var core = require('./core');
  var utils = require('./utils');
  var curve255 = require('./curve255');
  var ns = {};
  function _toString(vector) {
    var u = new Uint16Array(vector);
    return (new Buffer(new Uint8Array(u.buffer)));
  }
  function _fromString(vector) {
    if (Buffer.isBuffer(vector)) {
      var u = new Uint8Array(vector);
      return (new Uint16Array(u.buffer));
    }
    var result = new Array(16);
    for (var i = 0,
        l = 0; i < vector.length; i += 2) {
      result[l] = (vector.charCodeAt(i + 1) << 8) | vector.charCodeAt(i);
      l++;
    }
    return result;
  }
  ns.computeKey = function(privateComponent, publicComponent) {
    if (publicComponent) {
      return _toString(curve255.curve25519(_fromString(privateComponent), _fromString(publicComponent)));
    } else {
      return _toString(curve255.curve25519(_fromString(privateComponent)));
    }
  };
  ns.publicKey = function(privateKey) {
    return _toString(curve255.curve25519(_fromString(privateKey)));
  };
  ns.generateKey = function() {
    return core.generateKey(true);
  };
  module.exports = ns;
})(require('buffer').Buffer);
