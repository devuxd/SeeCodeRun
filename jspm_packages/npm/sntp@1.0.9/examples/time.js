/* */ 
(function(process) {
  var Sntp = require('../lib/index');
  var options = {
    host: 'nist1-sj.ustiming.org',
    port: 123,
    resolveReference: true,
    timeout: 1000
  };
  Sntp.time(options, function(err, time) {
    if (err) {
      console.log('Failed: ' + err.message);
      process.exit(1);
    }
    console.log(time);
    console.log('Local clock is off by: ' + time.t + ' milliseconds');
    process.exit(0);
  });
})(require('process'));
