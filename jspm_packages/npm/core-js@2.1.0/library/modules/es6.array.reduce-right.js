/* */ 
'use strict';
var $export = require('./_export'),
    $reduce = require('./_array-reduce');
$export($export.P + $export.F * !require('./_strict-method')([].reduceRight, true), 'Array', {reduceRight: function reduceRight(callbackfn) {
    return $reduce(this, callbackfn, arguments.length, arguments[1], true);
  }});
