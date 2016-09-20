var gulp = require('gulp');
var browserSync = require('browser-sync').create("SeeCodeRun");

// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:8082
gulp.task('serve', ['build'], function(done) {
  browserSync.init({
    online: false,
    open: false,
    injectChanges: false,
    ghostMode: false,
    // {
    //   clicks: true,
    //     forms: true,
    //   scroll: false
    // }
    reloadOnRestart: true,
    port: 8082,
    ui: false,
    server: {
      baseDir: ['.'],
      middleware: function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    }
  }, done);
});
