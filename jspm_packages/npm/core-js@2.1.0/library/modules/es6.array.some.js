/* */ 
'use strict';
var $export = require('./_export'),
    $some = require('./_array-methods')(3);
$export($export.P + $export.F * !require('./_strict-method')([].some, true), 'Array', {some: function some(callbackfn) {
    return $some(this, callbackfn, arguments[1]);
  }});
