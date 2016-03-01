/* */ 
"use strict";
var core = require('./core');
var utils = require('./utils');
var ns = {};
function curve25519_raw(f, c) {
  var a,
      x_1,
      q;
  x_1 = c;
  a = core.dbl(x_1, core.ONE());
  q = [x_1, core.ONE()];
  var n = 255;
  while (core.getbit(f, n) == 0) {
    n--;
    if (n < 0) {
      return core.ZERO();
    }
  }
  n--;
  var aq = [a, q];
  while (n >= 0) {
    var r,
        s;
    var b = core.getbit(f, n);
    r = core.sum(aq[0][0], aq[0][1], aq[1][0], aq[1][1], x_1);
    s = core.dbl(aq[1 - b][0], aq[1 - b][1]);
    aq[1 - b] = s;
    aq[b] = r;
    n--;
  }
  q = aq[1];
  q[1] = core.invmodp(q[1]);
  q[0] = core.mulmodp(q[0], q[1]);
  core.reduce(q[0]);
  return q[0];
}
function curve25519b32(a, b) {
  return _base32encode(curve25519(_base32decode(a), _base32decode(b)));
}
function curve25519(f, c) {
  if (!c) {
    c = core.BASE();
  }
  f[0] &= 0xFFF8;
  f[15] = (f[15] & 0x7FFF) | 0x4000;
  return curve25519_raw(f, c);
}
function _hexEncodeVector(k) {
  var hexKey = utils.hexEncode(k);
  hexKey = new Array(64 + 1 - hexKey.length).join('0') + hexKey;
  return hexKey.split(/(..)/).reverse().join('');
}
function _hexDecodeVector(v) {
  var hexKey = v.split(/(..)/).reverse().join('');
  return utils.hexDecode(hexKey);
}
ns.curve25519 = curve25519;
ns.curve25519_raw = curve25519_raw;
ns.hexEncodeVector = _hexEncodeVector;
ns.hexDecodeVector = _hexDecodeVector;
ns.hexencode = utils.hexEncode;
ns.hexdecode = utils.hexDecode;
ns.base32encode = utils.base32encode;
ns.base32decode = utils.base32decode;
module.exports = ns;
