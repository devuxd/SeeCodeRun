/* */ 
'use strict';
var margin = require('./margin');
var parsers = require('../parsers');
module.exports.definition = {
  set: parsers.subImplicitSetter('margin', 'left', margin.isValid, margin.parser),
  get: function() {
    return this.getPropertyValue('margin-left');
  },
  enumerable: true,
  configurable: true
};
