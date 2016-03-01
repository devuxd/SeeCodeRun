/* */ 
'use strict';
var $export = require('./_export'),
    $fails = require('./_fails'),
    aNumberValue = require('./_a-number-value'),
    $toPrecision = 1..toPrecision;
$export($export.P + $export.F * ($fails(function() {
  return $toPrecision.call(1, undefined) !== '1';
}) || !$fails(function() {
  $toPrecision.call({});
})), 'Number', {toPrecision: function toPrecision(precision) {
    var that = aNumberValue(this, 'Number#toPrecision: incorrect invocation!');
    return precision === undefined ? $toPrecision.call(that) : $toPrecision.call(that, precision);
  }});
