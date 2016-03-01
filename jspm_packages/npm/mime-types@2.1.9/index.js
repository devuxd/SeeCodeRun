/* */ 
'use strict';
var db = require('mime-db');
var extname = require('path').extname;
var extractTypeRegExp = /^\s*([^;\s]*)(?:;|\s|$)/;
var textTypeRegExp = /^text\//i;
exports.charset = charset;
exports.charsets = {lookup: charset};
exports.contentType = contentType;
exports.extension = extension;
exports.extensions = Object.create(null);
exports.lookup = lookup;
exports.types = Object.create(null);
populateMaps(exports.extensions, exports.types);
function charset(type) {
  if (!type || typeof type !== 'string') {
    return false;
  }
  var match = extractTypeRegExp.exec(type);
  var mime = match && db[match[1].toLowerCase()];
  if (mime && mime.charset) {
    return mime.charset;
  }
  if (match && textTypeRegExp.test(match[1])) {
    return 'UTF-8';
  }
  return false;
}
function contentType(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }
  var mime = str.indexOf('/') === -1 ? exports.lookup(str) : str;
  if (!mime) {
    return false;
  }
  if (mime.indexOf('charset') === -1) {
    var charset = exports.charset(mime);
    if (charset)
      mime += '; charset=' + charset.toLowerCase();
  }
  return mime;
}
function extension(type) {
  if (!type || typeof type !== 'string') {
    return false;
  }
  var match = extractTypeRegExp.exec(type);
  var exts = match && exports.extensions[match[1].toLowerCase()];
  if (!exts || !exts.length) {
    return false;
  }
  return exts[0];
}
function lookup(path) {
  if (!path || typeof path !== 'string') {
    return false;
  }
  var extension = extname('x.' + path).toLowerCase().substr(1);
  if (!extension) {
    return false;
  }
  return exports.types[extension] || false;
}
function populateMaps(extensions, types) {
  var preference = ['nginx', 'apache', undefined, 'iana'];
  Object.keys(db).forEach(function forEachMimeType(type) {
    var mime = db[type];
    var exts = mime.extensions;
    if (!exts || !exts.length) {
      return;
    }
    extensions[type] = exts;
    for (var i = 0; i < exts.length; i++) {
      var extension = exts[i];
      if (types[extension]) {
        var from = preference.indexOf(db[types[extension]].source);
        var to = preference.indexOf(mime.source);
        if (types[extension] !== 'application/octet-stream' && from > to || (from === to && types[extension].substr(0, 12) === 'application/')) {
          continue;
        }
      }
      types[extension] = type;
    }
  });
}
