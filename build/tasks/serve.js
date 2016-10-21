var gulp = require('gulp');
var browserSync = require('browser-sync').create("SeeCodeRun");

// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:3000
gulp.task('serve', ['build'], function(done) {
  browserSync.init({
    online: false,
    open: false,
    injectChanges: false,
    ghostMode: false,
    // {
    //   clicks: true,
    //     scroll: true,
    //   forms: {
    //   submit: true,
    //     inputs: true,
    //     toggles: true
    // }
    // },
    socket: {
      socketIoOptions: {
        log: true
      },
      socketIoClientConfig: {
        reconnectionAttempts: 500
      },
      // path: "/browser-sync/socket.io",
      // clientPath: "/browser-sync",
      // namespace: "/browser-sync",
      clients: {
        heartbeatTimeout: 50000
      }
    },
    reloadOnRestart: true,
    port: 3000,
    ui: {
      port: 3001,
      weinre: {
        port: 8080
      }
    },
    // false,
    server: {
      baseDir: ['.'],
      middleware: function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    }
  }, done);
});
