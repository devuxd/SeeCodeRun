/* */ 
'use strict';
var Promise = require('pinkie-promise');
var runner = require('./runner');
var schemas = require('./schemas/index');
var promisify = function(schema) {
  return function(data) {
    return new Promise(function(resolve, reject) {
      runner(schema, data, function(err, valid) {
        return err === null ? resolve(data) : reject(err);
      });
    });
  };
};
module.exports = promisify(schemas.har);
Object.keys(schemas).map(function(name) {
  module.exports[name] = promisify(schemas[name]);
});
