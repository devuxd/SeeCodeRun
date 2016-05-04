var gulp  = require('gulp')
var shell = require('gulp-shell')

// This task will deploy the app to firebase
// by bundling the app using gulp bundle
// and then deploy using the firebase commands

gulp.task('deploy', ['export'], shell.task(['firebase deploy']));