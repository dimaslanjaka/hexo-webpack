// enable typescript file import from js file
require('ts-node').register({
  compilerOptions: { ...require('./tsconfig.json').compilerOptions, checkJs: false, strict: false, noEmit: true },
  transpileOnly: true
});

const yaml = require('yaml');
const gulp = require('gulp');
const { obj } = require('through2');
const { fs, writefile } = require('sbg-utility');
/** @type {typeof import('./_config.json')} */
const config = yaml.parse(fs.readFileSync(__dirname + '/_config.yml', 'utf-8'));
const { modifyConfigJson } = require('./config/utils');
const { default: genR, noticeWebpack } = require('./gulpfile.genr');
require('./gulpfile.build');

// notice webpack file changes
// by add space to ./src/index.tsx
gulp.task('notice', noticeWebpack);

// generate route from processed post
// need `sbg post copy`

const generateRouteTask = options => gulp.series(() => genR(options), 'notice');
// normal
gulp.task('route', generateRouteTask());
gulp.task('r', generateRouteTask());

// with clean arg
gulp.task('rc', generateRouteTask({ clean: true }));

// generate posts list
gulp.task('map', function () {
  const dest = __dirname + '/.cache/posts.json';
  const routes = [];
  const gc = require('./gulp-cache').default;
  const cache = new gc({ cacheFile: __dirname + '/.cache/gulp-map-task' });
  return gulp
    .src('**/*.md', {
      cwd: __dirname + '/source/_posts',
      ignore: [
        '**/LICENSE',
        '**/License.md',
        '**/node_modules/**',
        '**/readme.md',
        '**/bin',
        '**/.vscode',
        '**/.frontmatter',
        // add exclude from _config.yml
        ...config.exclude
      ]
    })
    .pipe(cache.start())
    .pipe(
      obj((vinyl, _enc, callback) => {
        if (vinyl.isNull() || vinyl.isStream() || vinyl.isDirectory()) return callback(); // skip null and stream object
        routes.push(vinyl.path);
        // skip writing
        callback();
      })
    )
    .pipe(gulp.dest('./tmp/fake'))
    .on('end', () => {
      const w = writefile(dest, JSON.stringify(routes, null, 2));
      cache.save();
      console.log('map stream ends', w.file);
    });
});

// just testing
const modifyCfg = () => {
  // write to ./config.json
  modifyConfigJson({ mode: 'development' });
};
gulp.task('direct', () => genR(__dirname + '/src-posts', { clean: true }).then(modifyCfg));
gulp.task('c', () => {
  return gulp
    .src('**/*.md', {
      cwd: __dirname + '/src-posts',
      ignore: [
        '**/LICENSE',
        '**/License.md',
        '**/node_modules/**',
        '**/readme.md',
        '**/bin',
        '**/.vscode',
        '**/.frontmatter',
        // add exclude from _config.yml
        ...config.exclude
      ]
    })
    .pipe(require('./gulp-cache').gulpCache())
    .pipe(
      obj((vinyl, _enc, callback) => {
        if (vinyl.isNull() || vinyl.isStream() || vinyl.isDirectory()) return callback(); // skip null and stream object
        //
        callback(null, vinyl);
      })
    )
    .pipe(gulp.dest(__dirname + '/tmp/fake-c'))
    .on('end', modifyCfg);
});
gulp.task('rl', () => genR({ clean: true, limit: 4 }).then(modifyCfg));
gulp.task('rr', () => genR({ clean: true, limit: 4, randomize: true }).then(modifyCfg));
// test: only specified post
gulp.task('feature', () =>
  genR({
    clean: true,
    onBeforePostsProcess: posts => {
      return posts.filter(post => {
        if (post.endsWith('Quiz.md')) return true;
        return false;
      });
    }
  })
);
