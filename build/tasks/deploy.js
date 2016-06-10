var gulp  = require('gulp');
var shell = require('gulp-shell');
var runSequence = require('run-sequence');

// This task will deploy the app to firebase
// by bundling the app using gulp bundle
// and then deploy using the firebase commands

gulp.task('firebase-deploy', ['export'],
    shell.task(['firebase deploy'])
);

gulp.task('deploy',
    function(callback) {
      return runSequence(
        'firebase-deploy',
        'unbundle',
        callback
      );
    }
);