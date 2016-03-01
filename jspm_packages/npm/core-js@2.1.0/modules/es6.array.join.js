/* */ 
'use strict';
var $export = require('./_export'),
    toIObject = require('./_to-iobject'),
    arrayJoin = [].join;
$export($export.P + $export.F * (require('./_iobject') != Object || !require('./_strict-method')(arrayJoin)), 'Array', {join: function join(separator) {
    return arrayJoin.call(toIObject(this), separator === undefined ? ',' : separator);
  }});
