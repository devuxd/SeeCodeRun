/* */ 
'use strict';
var $export = require('./_export'),
    aFunction = require('./_a-function'),
    toObject = require('./_to-object'),
    fails = require('./_fails'),
    $sort = [].sort,
    test = [1, 2, 3];
$export($export.P + $export.F * (fails(function() {
  test.sort(undefined);
}) || !fails(function() {
  test.sort(null);
}) || !require('./_strict-method')($sort)), 'Array', {sort: function sort(comparefn) {
    return comparefn === undefined ? $sort.call(toObject(this)) : $sort.call(toObject(this), aFunction(comparefn));
  }});
