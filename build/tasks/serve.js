var gulp = require('gulp');
var browserSync = require('browser-sync').create();

// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:9000
gulp.task('serve', ['build'], function(done) {
  browserSync.init({
    online: false,
    open: false,
    injectChanges: true,
    ghostMode: false,
    port: 8082,
    server: {
      baseDir: ['.'],
      middleware: function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    }
  }, done);
});
