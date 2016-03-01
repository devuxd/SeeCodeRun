/* */ 
'use strict';
var margin = require('./margin');
var parsers = require('../parsers');
module.exports.definition = {
  set: parsers.subImplicitSetter('margin', 'bottom', margin.isValid, margin.parser),
  get: function() {
    return this.getPropertyValue('margin-bottom');
  },
  enumerable: true,
  configurable: true
};
