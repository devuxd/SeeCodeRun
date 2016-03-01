/* */ 
'use strict';
var $export = require('./_export'),
    $every = require('./_array-methods')(4);
$export($export.P + $export.F * !require('./_strict-method')([].every, true), 'Array', {every: function every(callbackfn) {
    return $every(this, callbackfn, arguments[1]);
  }});
