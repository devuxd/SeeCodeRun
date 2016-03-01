/* */ 
var $keys = require('./_object-keys-internal'),
    enumBugKeys = require('./_enum-bug-keys');
module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};
