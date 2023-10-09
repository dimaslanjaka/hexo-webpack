require('ts-node').register({ compilerOptions: require('./tsconfig.json').compilerOptions });
const { spawnAsync } = require('git-command-helper');
const gulp = require('gulp');
const { init } = require('./test/render');
const { obj } = require('through2');
const { fs, path, writefile } = require('sbg-utility');
const { default: toJsx } = require('./test/toJsx');
const paths = require('./config/paths');
const { default: genRoute } = require('./test/genRoute');
const Promise = require('bluebird');

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

// generate route stream method
// clone of ./test/generate-route.js
async function genR(options = {}) {
  await init();
  const dest = paths.src + '/posts';
  if (options.clean) {
    await fs.emptyDir(dest);
  }
  // let total = 0;
  const routes = [];
  const posts = require('./.cache/posts.json');
  await Promise.all(posts)
    .each(async (postPath, i) => {
      if (options.limit) {
        if (i > options.limit) return;
      }
      /**
       * @type {Promise<import('hexo-post-parser').Nullable<{ route: Awaited<ReturnType<typeof genRoute>>; jsx: Awaited<ReturnType<typeof toJsx>>; value: Record<string, any>; }>>}
       */
      const { body: _body, ...route } = await genRoute(postPath);
      try {
        const jsx = await toJsx({
          body: route.body,
          source: route.source,
          dest: path.join(dest, route.id)
        });
        // total++;
        const value = { ...route, jsxPath: jsx.jsxPath };
        // console.log(total, route.permalink);
        routes.push(value);

        return { route, jsx, value };
      } catch (e) {
        console.error('jsx cannot parse', route.source);
        console.error(e);
      }
    })
    .then(() => {
      writefile(__dirname + '/routes.json', JSON.stringify(routes, null, 2));
    });
}

// generate route from processed post
// using `sbg post copy`
gulp.task('rc', () => genR({ clean: true }));
gulp.task('rl', () => genR({ clean: true, limit: 4 }));
gulp.task('route', genR);
gulp.task('r', genR);

// mapping
const yaml = require('yaml');
const config = yaml.parse(fs.readFileSync(__dirname + '/_config.yml', 'utf-8'));

gulp.task('map', function () {
  const dest = __dirname + '/.cache/posts.json';
  const routes = [];
  const gc = require('./gulp-cache').default;
  const cache = new gc();
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
      const w = writefile(dest, JSON.stringify(routes));
      cache.onexit();
      console.log('map stream ends', w.file);
    });
});

// just testing
gulp.task('direct', () => genR(__dirname + '/src-posts', { clean: true }));
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
    .pipe(gulp.dest(__dirname + '/tmp/fake-c'));
});
