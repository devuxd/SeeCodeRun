/* */ 
(function(Buffer) {
  module.exports = {
    read: read,
    write: write
  };
  var assert = require('assert-plus');
  var rfc4253 = require('./rfc4253');
  var utils = require('../utils');
  var Key = require('../key');
  var PrivateKey = require('../private-key');
  var sshpriv = require('./ssh-private');
  var SSHKEY_RE = /^([a-z0-9-]+)[ \t]+([a-zA-Z0-9+\/]+[=]*)([\n \t]+([^\n]+))?$/;
  var SSHKEY_RE2 = /^([a-z0-9-]+)[ \t]+([a-zA-Z0-9+\/ \t\n]+[=]*)(.*)$/;
  function read(buf) {
    if (typeof(buf) !== 'string') {
      assert.buffer(buf, 'buf');
      buf = buf.toString('ascii');
    }
    var trimmed = buf.trim().replace(/[\\\r]/g, '');
    var m = trimmed.match(SSHKEY_RE);
    if (!m)
      m = trimmed.match(SSHKEY_RE2);
    assert.ok(m, 'key must match regex');
    var type = rfc4253.algToKeyType(m[1]);
    var kbuf = new Buffer(m[2], 'base64');
    var key;
    var ret = {};
    if (m[4]) {
      try {
        key = rfc4253.read(kbuf);
      } catch (e) {
        m = trimmed.match(SSHKEY_RE2);
        assert.ok(m, 'key must match regex');
        kbuf = new Buffer(m[2], 'base64');
        key = rfc4253.readInternal(ret, 'public', kbuf);
      }
    } else {
      key = rfc4253.readInternal(ret, 'public', kbuf);
    }
    assert.strictEqual(type, key.type);
    if (m[4] && m[4].length > 0) {
      key.comment = m[4];
    } else if (ret.consumed) {
      var data = m[2] + m[3];
      var realOffset = Math.ceil(ret.consumed / 3) * 4;
      data = data.slice(0, realOffset - 2).replace(/[^a-zA-Z0-9+\/=]/g, '') + data.slice(realOffset - 2);
      var padding = ret.consumed % 3;
      if (padding > 0 && data.slice(realOffset - 1, realOffset) !== '=')
        realOffset--;
      while (data.slice(realOffset, realOffset + 1) === '=')
        realOffset++;
      var trailer = data.slice(realOffset);
      trailer = trailer.replace(/[\r\n]/g, ' ').replace(/^\s+/, '');
      if (trailer.match(/^[a-zA-Z0-9]/))
        key.comment = trailer;
    }
    return (key);
  }
  function write(key) {
    assert.object(key);
    if (!Key.isKey(key))
      throw (new Error('Must be a public key'));
    var parts = [];
    var alg = rfc4253.keyTypeToAlg(key);
    parts.push(alg);
    var buf = rfc4253.write(key);
    parts.push(buf.toString('base64'));
    if (key.comment)
      parts.push(key.comment);
    return (new Buffer(parts.join(' ')));
  }
})(require('buffer').Buffer);
