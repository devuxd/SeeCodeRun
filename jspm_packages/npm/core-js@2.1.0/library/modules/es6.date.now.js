/* */ 
var $export = require('./_export');
$export($export.S, 'Date', {now: function() {
    return +new Date;
  }});
