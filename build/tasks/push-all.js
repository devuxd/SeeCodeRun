var gulp  = require('gulp');
var shell = require('gulp-shell');
var runSequence = require('run-sequence');
var yargs = require('yargs');
var argv = yargs.argv;

var files = (argv.files || argv.file ||argv.f || 'all');
var message = (argv.m || argv.message|| 'automated push');

if (!files) {
  throw new Error('Unrecognized file format "' + files + '".');
}
if (!message) {
  throw new Error('Unrecognized commit message "' + message + '".');
}

gulp.task('git-add-all',
    shell.task(['git status', `git add --${files}`])
);

gulp.task('git-commit',
    shell.task([`git commit -m "${message}"`])
);

gulp.task('git-push',
    shell.task(['git push'])
);

gulp.task('push-all',
    function(callback) {
      return runSequence(
        ['git-add-all'],
        ['git-commit'],
        ['git-push'],
        callback
      );
    }
);