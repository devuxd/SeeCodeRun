/* */ 
'use strict';
var $export = require('./_export'),
    $forEach = require('./_array-methods')(0),
    STRICT = require('./_strict-method')([].forEach, true);
$export($export.P + $export.F * !STRICT, 'Array', {forEach: function forEach(callbackfn) {
    return $forEach(this, callbackfn, arguments[1]);
  }});
