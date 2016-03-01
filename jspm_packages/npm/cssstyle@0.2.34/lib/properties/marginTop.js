/* */ 
'use strict';
var margin = require('./margin');
var parsers = require('../parsers');
module.exports.definition = {
  set: parsers.subImplicitSetter('margin', 'top', margin.isValid, margin.parser),
  get: function() {
    return this.getPropertyValue('margin-top');
  },
  enumerable: true,
  configurable: true
};
