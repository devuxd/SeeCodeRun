/* */ 
'use strict';
var padding = require('./padding');
var parsers = require('../parsers');
module.exports.definition = {
  set: parsers.subImplicitSetter('padding', 'top', padding.isValid, padding.parser),
  get: function() {
    return this.getPropertyValue('padding-top');
  },
  enumerable: true,
  configurable: true
};
