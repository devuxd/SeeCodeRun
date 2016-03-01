/* */ 
var $export = require('./_export'),
    $parseInt = require('./_parse-int');
$export($export.S + $export.F * (Number.parseInt != $parseInt), 'Number', {parseInt: $parseInt});
