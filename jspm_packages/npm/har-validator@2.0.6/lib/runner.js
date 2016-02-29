/* */ 
'use strict';
var schemas = require('./schemas/index');
var ValidationError = require('./error');
var validator = require('is-my-json-valid');
module.exports = function(schema, data, cb) {
  var valid = false;
  var validate = validator(schema, {
    greedy: true,
    verbose: true,
    schemas: schemas
  });
  if (data !== undefined) {
    valid = validate(data);
  }
  if (typeof cb === 'function') {
    return cb(validate.errors ? new ValidationError(validate.errors) : null, valid);
  }
  return valid;
};
