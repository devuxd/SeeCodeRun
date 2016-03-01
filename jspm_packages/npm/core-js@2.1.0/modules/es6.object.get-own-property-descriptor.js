/* */ 
var toIObject = require('./_to-iobject'),
    $getOwnPropertyDescriptor = require('./_object-gopd').f;
require('./_object-sap')('getOwnPropertyDescriptor', function() {
  return function getOwnPropertyDescriptor(it, key) {
    return $getOwnPropertyDescriptor(toIObject(it), key);
  };
});
