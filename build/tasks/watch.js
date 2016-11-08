var gulp = require('gulp');
var paths = require('../paths');
// outputs changes to files to the console
function reportChange(event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
}

// this task wil watch for changes
// to js, html, and css files and call the
// reportChange method. Also, by depending on the
// serve task, it will instantiate a browserSync session
gulp.task('watch', ['serve'], function() {
  var browserSync = require('browser-sync').get("SeeCodeRun");
  // var stream      = browserSync.stream;
  var reload = browserSync.reload;
  gulp.watch(paths.source, ['build-system', reload]).on('change', reportChange);
  gulp.watch(paths.html, ['build-html', reload]).on('change', reportChange);
  gulp.watch(paths.css, ['build-css', reload]).on('change', reportChange);

  gulp.watch(paths.style, function() {
    return gulp.src(paths.style)
      .pipe(gulp.dest(paths.output))
      .pipe(reload({stream: true}));
  }).on('change', reportChange);

  gulp.watch(paths.include, function() {
    return gulp.src(paths.include)
      .pipe(gulp.dest(paths.output))
      .pipe(reload({stream: true}));
  }).on('change', reportChange);

  gulp.watch(paths.resources, function() {
    return gulp.src(paths.resources)
      .pipe(gulp.dest(paths.output))
      .pipe(reload({stream: true}));
  }).on('change', reportChange);

  gulp.watch(paths.e2eSpecsDist, function() {
    return gulp.src(paths.e2eSpecsDist)
      .pipe(gulp.dest(paths.output))
      .pipe(reload({stream: true}));
  }).on('change', reportChange);

});
