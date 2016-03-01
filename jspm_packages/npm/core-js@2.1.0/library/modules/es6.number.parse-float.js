/* */ 
var $export = require('./_export'),
    $parseFloat = require('./_parse-float');
$export($export.S + $export.F * (Number.parseFloat != $parseFloat), 'Number', {parseFloat: $parseFloat});
