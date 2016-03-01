/* */ 
(function(Buffer, process) {
  var fs = require('fs');
  var zlib = require('zlib');
  var strs = require('./stringstream');
  var utf8Stream = fs.createReadStream('massiveLogFile.gz').pipe(zlib.createGunzip()).pipe(strs('utf8'));
  utf8Stream.pipe(process.stdout);
  var hex64Stream = fs.createReadStream('myFile').pipe(strs('utf8', 'hex')).pipe(strs('hex', 'base64'));
  hex64Stream.pipe(process.stdout);
  var stream = fs.createReadStream('myFile').pipe(strs('base64'));
  var base64Str = '';
  stream.on('data', function(data) {
    base64Str += data;
  });
  stream.on('end', function() {
    console.log('My base64 encoded file is: ' + base64Str);
    console.log('Original file is: ' + new Buffer(base64Str, 'base64'));
  });
})(require('buffer').Buffer, require('process'));
