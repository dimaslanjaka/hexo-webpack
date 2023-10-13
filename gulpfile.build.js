const paths = require('./config/paths');
const gulp = require('gulp');
const { generateRouteHtml } = require('./html/generate');
const { copyPath } = require('sbg-utility');
const gch = require('git-command-helper');

// const publics = [];
//[paths.public, , path.join(paths.cwd, 'source')];

// generate html to build dir
gulp.task('build-html', generateRouteHtml);
// copy assets to build dir
gulp.task('build-asset', async () => {
  // backup dist/index.html
  const backupIndex = paths.tmp + '/backup/index.html';
  const sourceIndex = paths.build + '/index.html';
  await copyPath(sourceIndex, backupIndex);
  // copy paths.public to paths.build
  await new Promise((resolve, reject) => {
    gulp
      .src('**/*.*', { cwd: paths.public, ignore: ['.gitignore'] })
      .pipe(gulp.dest(paths.build))
      .on('end', () => resolve('ends'))
      .on('error', reject);
  });
  // copy /source to paths.build
  await new Promise((resolve, reject) => {
    gulp
      .src('**/*.*', {
        cwd: paths.cwd + '/source',
        ignore: [
          '.gitignore',
          /** ignore auto generated processed post by `sbg post copy` */
          '**/_posts/**'
        ]
      })
      .pipe(gulp.dest(paths.build))
      .on('end', () => resolve('ends'))
      .on('error', reject);
  });
  // restore dist/index
  await copyPath(backupIndex, sourceIndex);
});

gulp.task('build', gulp.series('build-html', 'build-asset'));

gulp.task('watch-build', () => {
  gulp.watch(
    ['src/**/*.*', 'public/**/*.*', 'source/**/*.*', 'config/**/*.*', 'html/**/*.*', './_config.json', './routes.json'],
    {
      ignored: ['**/node_modules', '**/posts/**', '**/_posts/**']
    },
    async () => {
      await gch.spawnAsync('yarn', ['build'], { shell: true, stdio: 'inherit' });
    }
  );
});
