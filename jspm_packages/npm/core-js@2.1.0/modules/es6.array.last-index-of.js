/* */ 
'use strict';
var $export = require('./_export'),
    toIObject = require('./_to-iobject'),
    toInteger = require('./_to-integer'),
    toLength = require('./_to-length');
$export($export.P + $export.F * !require('./_strict-method')([].lastIndexOf), 'Array', {lastIndexOf: function lastIndexOf(searchElement) {
    var O = toIObject(this),
        length = toLength(O.length),
        index = length - 1;
    if (arguments.length > 1)
      index = Math.min(index, toInteger(arguments[1]));
    if (index < 0)
      index = length + index;
    for (; index >= 0; index--)
      if (index in O)
        if (O[index] === searchElement)
          return index;
    return -1;
  }});
