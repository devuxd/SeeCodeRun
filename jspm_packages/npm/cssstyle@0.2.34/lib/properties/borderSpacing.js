/* */ 
'use strict';
var parsers = require('../parsers');
var parse = function parse(v) {
  if (v.toLowerCase() === 'inherit') {
    return v;
  }
  var parts = v.split(/\s+/);
  if (parts.length !== 1 && parts.length !== 2) {
    return undefined;
  }
  parts.forEach(function(part) {
    if (parsers.valueType(part) !== parsers.TYPES.LENGTH) {
      return undefined;
    }
  });
  return v;
};
module.exports.isValid = function isValid(v) {
  return parse(v) !== undefined;
};
module.exports.definition = {
  set: function(v) {
    this._setProperty('border-spacing', parse(v));
  },
  get: function() {
    return this.getPropertyValue('border-spacing');
  },
  enumerable: true,
  configurable: true
};
