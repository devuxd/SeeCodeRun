/* */ 
var toObject = require('./_to-object'),
    $keys = require('./_object-keys');
require('./_object-sap')('keys', function() {
  return function keys(it) {
    return $keys(toObject(it));
  };
});
