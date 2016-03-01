/* */ 
'use strict';
var padding = require('./padding');
var parsers = require('../parsers');
module.exports.definition = {
  set: parsers.subImplicitSetter('padding', 'left', padding.isValid, padding.parser),
  get: function() {
    return this.getPropertyValue('padding-left');
  },
  enumerable: true,
  configurable: true
};
