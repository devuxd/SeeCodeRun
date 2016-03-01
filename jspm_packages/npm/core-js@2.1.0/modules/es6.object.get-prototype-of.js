/* */ 
var toObject = require('./_to-object'),
    $getPrototypeOf = require('./_object-gpo');
require('./_object-sap')('getPrototypeOf', function() {
  return function getPrototypeOf(it) {
    return $getPrototypeOf(toObject(it));
  };
});
