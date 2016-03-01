/* */ 
'use strict';
var $export = require('./_export'),
    $indexOf = require('./_array-includes')(false);
$export($export.P + $export.F * !require('./_strict-method')([].indexOf), 'Array', {indexOf: function indexOf(searchElement) {
    return $indexOf(this, searchElement, arguments[1]);
  }});
