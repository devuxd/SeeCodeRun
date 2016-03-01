/* */ 
'use strict';
var $export = require('./_export'),
    $filter = require('./_array-methods')(2);
$export($export.P + $export.F * !require('./_strict-method')([].filter, true), 'Array', {filter: function filter(callbackfn) {
    return $filter(this, callbackfn, arguments[1]);
  }});
