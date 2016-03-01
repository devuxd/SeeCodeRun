/* */ 
(function(Buffer) {
  var assert = require('assert');
  var ASN1 = require('./types');
  var errors = require('./errors');
  var newInvalidAsn1Error = errors.newInvalidAsn1Error;
  function Reader(data) {
    if (!data || !Buffer.isBuffer(data))
      throw new TypeError('data must be a node Buffer');
    this._buf = data;
    this._size = data.length;
    this._len = 0;
    this._offset = 0;
  }
  Object.defineProperty(Reader.prototype, 'length', {
    enumerable: true,
    get: function() {
      return (this._len);
    }
  });
  Object.defineProperty(Reader.prototype, 'offset', {
    enumerable: true,
    get: function() {
      return (this._offset);
    }
  });
  Object.defineProperty(Reader.prototype, 'remain', {get: function() {
      return (this._size - this._offset);
    }});
  Object.defineProperty(Reader.prototype, 'buffer', {get: function() {
      return (this._buf.slice(this._offset));
    }});
  Reader.prototype.readByte = function(peek) {
    if (this._size - this._offset < 1)
      return null;
    var b = this._buf[this._offset] & 0xff;
    if (!peek)
      this._offset += 1;
    return b;
  };
  Reader.prototype.peek = function() {
    return this.readByte(true);
  };
  Reader.prototype.readLength = function(offset) {
    if (offset === undefined)
      offset = this._offset;
    if (offset >= this._size)
      return null;
    var lenB = this._buf[offset++] & 0xff;
    if (lenB === null)
      return null;
    if ((lenB & 0x80) == 0x80) {
      lenB &= 0x7f;
      if (lenB == 0)
        throw newInvalidAsn1Error('Indefinite length not supported');
      if (lenB > 4)
        throw newInvalidAsn1Error('encoding too long');
      if (this._size - offset < lenB)
        return null;
      this._len = 0;
      for (var i = 0; i < lenB; i++)
        this._len = (this._len << 8) + (this._buf[offset++] & 0xff);
    } else {
      this._len = lenB;
    }
    return offset;
  };
  Reader.prototype.readSequence = function(tag) {
    var seq = this.peek();
    if (seq === null)
      return null;
    if (tag !== undefined && tag !== seq)
      throw newInvalidAsn1Error('Expected 0x' + tag.toString(16) + ': got 0x' + seq.toString(16));
    var o = this.readLength(this._offset + 1);
    if (o === null)
      return null;
    this._offset = o;
    return seq;
  };
  Reader.prototype.readInt = function() {
    return this._readTag(ASN1.Integer);
  };
  Reader.prototype.readBoolean = function() {
    return (this._readTag(ASN1.Boolean) === 0 ? false : true);
  };
  Reader.prototype.readEnumeration = function() {
    return this._readTag(ASN1.Enumeration);
  };
  Reader.prototype.readString = function(tag, retbuf) {
    if (!tag)
      tag = ASN1.OctetString;
    var b = this.peek();
    if (b === null)
      return null;
    if (b !== tag)
      throw newInvalidAsn1Error('Expected 0x' + tag.toString(16) + ': got 0x' + b.toString(16));
    var o = this.readLength(this._offset + 1);
    if (o === null)
      return null;
    if (this.length > this._size - o)
      return null;
    this._offset = o;
    if (this.length === 0)
      return retbuf ? new Buffer(0) : '';
    var str = this._buf.slice(this._offset, this._offset + this.length);
    this._offset += this.length;
    return retbuf ? str : str.toString('utf8');
  };
  Reader.prototype.readOID = function(tag) {
    if (!tag)
      tag = ASN1.OID;
    var b = this.readString(tag, true);
    if (b === null)
      return null;
    var values = [];
    var value = 0;
    for (var i = 0; i < b.length; i++) {
      var byte = b[i] & 0xff;
      value <<= 7;
      value += byte & 0x7f;
      if ((byte & 0x80) == 0) {
        values.push(value);
        value = 0;
      }
    }
    value = values.shift();
    values.unshift(value % 40);
    values.unshift((value / 40) >> 0);
    return values.join('.');
  };
  Reader.prototype._readTag = function(tag) {
    assert.ok(tag !== undefined);
    var b = this.peek();
    if (b === null)
      return null;
    if (b !== tag)
      throw newInvalidAsn1Error('Expected 0x' + tag.toString(16) + ': got 0x' + b.toString(16));
    var o = this.readLength(this._offset + 1);
    if (o === null)
      return null;
    if (this.length > 4)
      throw newInvalidAsn1Error('Integer too long: ' + this.length);
    if (this.length > this._size - o)
      return null;
    this._offset = o;
    var fb = this._buf[this._offset];
    var value = 0;
    for (var i = 0; i < this.length; i++) {
      value <<= 8;
      value |= (this._buf[this._offset++] & 0xff);
    }
    if ((fb & 0x80) == 0x80 && i !== 4)
      value -= (1 << (i * 8));
    return value >> 0;
  };
  module.exports = Reader;
})(require('buffer').Buffer);
