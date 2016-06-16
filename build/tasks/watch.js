var gulp = require('gulp');
var paths = require('../paths');
var browserSync = require('browser-sync');

// outputs changes to files to the console
function reportChange(event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
}

// this task wil watch for changes
// to js, html, and css files and call the
// reportChange method. Also, by depending on the
// serve task, it will instantiate a browserSync session
gulp.task('watch', ['serve'], function() {
  gulp.watch(paths.source, ['build-system', browserSync.reload]).on('change', reportChange);
  gulp.watch(paths.html, ['build-html', browserSync.reload]).on('change', reportChange);
  gulp.watch(paths.css, ['build-css']).on('change', reportChange);
  
  gulp.watch(paths.style, function() {
    return gulp.src(paths.style)
      .pipe(browserSync.stream({once: true}));
  }).on('change', reportChange);
  
  gulp.watch(paths.include, function() {
    return gulp.src(paths.include)
      .pipe(browserSync.stream({once: true}));
  }).on('change', reportChange);
  
  gulp.watch(paths.resources, function() {
    return gulp.src(paths.resources)
      .pipe(browserSync.stream({once: true}));
  }).on('change', reportChange);
  
  gulp.watch(paths.e2eSpecsDist, function() {
    return gulp.src(paths.e2eSpecsDist)
      .pipe(browserSync.stream({once: true}));
  }).on('change', reportChange);
});
