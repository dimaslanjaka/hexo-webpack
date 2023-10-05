const { spawnAsync } = require('git-command-helper');
const gulp = require('gulp');

gulp.task('watch', function () {
  /**
   * @param {gulp.TaskFunctionCallback} testCb
   */
  const run = function (testCb) {
    spawnAsync('node', ['-r', 'ts-node/register', 'test/render.js'], { stdio: 'inherit' })
      .then(() => testCb())
      .catch(testCb);
  };
  run(() =>
    gulp.watch(['src/**/*.*', 'public/**/*.*', 'test/**/*.*', '!**/node_modules/**', '!**/dist/**', '!**/tmp/**'], run)
  );
});
