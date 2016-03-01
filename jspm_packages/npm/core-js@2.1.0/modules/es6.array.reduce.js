/* */ 
'use strict';
var $export = require('./_export'),
    $reduce = require('./_array-reduce');
$export($export.P + $export.F * !require('./_strict-method')([].reduce, true), 'Array', {reduce: function reduce(callbackfn) {
    return $reduce(this, callbackfn, arguments.length, arguments[1], false);
  }});
