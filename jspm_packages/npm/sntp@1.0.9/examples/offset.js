/* */ 
var Sntp = require('../lib/index');
Sntp.offset(function(err, offset) {
  console.log(offset);
  Sntp.offset(function(err, offset) {
    console.log(offset);
  });
});
