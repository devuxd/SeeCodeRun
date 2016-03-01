/* */ 
'use strict';
var UNICODE = require('../common/unicode');
var $ = UNICODE.CODE_POINTS;
function isReservedCodePoint(cp) {
  return cp >= 0xD800 && cp <= 0xDFFF || cp > 0x10FFFF;
}
function isSurrogatePair(cp1, cp2) {
  return cp1 >= 0xD800 && cp1 <= 0xDBFF && cp2 >= 0xDC00 && cp2 <= 0xDFFF;
}
function getSurrogatePairCodePoint(cp1, cp2) {
  return (cp1 - 0xD800) * 0x400 + 0x2400 + cp2;
}
var Preprocessor = module.exports = function(html) {
  this.write(html);
  this.pos = this.html.charCodeAt(0) === $.BOM ? 0 : -1;
  this.gapStack = [];
  this.lastGapPos = -1;
  this.skipNextNewLine = false;
};
Preprocessor.prototype.write = function(html) {
  if (this.html) {
    this.html = this.html.substring(0, this.pos + 1) + html + this.html.substring(this.pos + 1, this.html.length);
  } else
    this.html = html;
  this.lastCharPos = this.html.length - 1;
};
Preprocessor.prototype.advanceAndPeekCodePoint = function() {
  this.pos++;
  if (this.pos > this.lastCharPos)
    return $.EOF;
  var cp = this.html.charCodeAt(this.pos);
  if (this.skipNextNewLine && cp === $.LINE_FEED) {
    this.skipNextNewLine = false;
    this._addGap();
    return this.advanceAndPeekCodePoint();
  }
  if (cp === $.CARRIAGE_RETURN) {
    this.skipNextNewLine = true;
    return $.LINE_FEED;
  }
  this.skipNextNewLine = false;
  return cp >= 0xD800 ? this._processHighRangeCodePoint(cp) : cp;
};
Preprocessor.prototype._processHighRangeCodePoint = function(cp) {
  if (this.pos !== this.lastCharPos) {
    var nextCp = this.html.charCodeAt(this.pos + 1);
    if (isSurrogatePair(cp, nextCp)) {
      this.pos++;
      cp = getSurrogatePairCodePoint(cp, nextCp);
      this._addGap();
    }
  }
  if (isReservedCodePoint(cp))
    cp = $.REPLACEMENT_CHARACTER;
  return cp;
};
Preprocessor.prototype._addGap = function() {
  this.gapStack.push(this.lastGapPos);
  this.lastGapPos = this.pos;
};
Preprocessor.prototype.retreat = function() {
  if (this.pos === this.lastGapPos) {
    this.lastGapPos = this.gapStack.pop();
    this.pos--;
  }
  this.pos--;
};
