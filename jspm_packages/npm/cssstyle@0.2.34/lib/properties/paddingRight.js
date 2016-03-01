/* */ 
'use strict';
var padding = require('./padding');
var parsers = require('../parsers');
module.exports.definition = {
  set: parsers.subImplicitSetter('padding', 'right', padding.isValid, padding.parser),
  get: function() {
    return this.getPropertyValue('padding-right');
  },
  enumerable: true,
  configurable: true
};
