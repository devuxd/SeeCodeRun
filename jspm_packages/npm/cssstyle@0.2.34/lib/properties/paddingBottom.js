/* */ 
'use strict';
var padding = require('./padding');
var parsers = require('../parsers');
module.exports.definition = {
  set: parsers.subImplicitSetter('padding', 'bottom', padding.isValid, padding.parser),
  get: function() {
    return this.getPropertyValue('padding-bottom');
  },
  enumerable: true,
  configurable: true
};
