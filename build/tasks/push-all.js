var gulp  = require('gulp');
var shell = require('gulp-shell');
var runSequence = require('run-sequence');
var yargs = require('yargs');
var argv = yargs.argv;


var bump = (argv.bump || 'automated push').toLowerCase();

if (!bump) {
  throw new Error('Unrecognized commit message "' + bump + '".');
}

gulp.task('git-add-all',
    shell.task(['git status', 'git add --all'])
);

gulp.task('git-commit',
    shell.task([`git commit -m "${bump}"`])
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