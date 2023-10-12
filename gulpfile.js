require('ts-node').register({
  compilerOptions: { ...require('./tsconfig.json').compilerOptions, checkJs: false, strict: false, noEmit: true },
  transpileOnly: true
});

const yaml = require('yaml');
const gulp = require('gulp');
const { init } = require('./test/render');
const { obj } = require('through2');
const { fs, path, writefile } = require('sbg-utility');
const config = yaml.parse(fs.readFileSync(__dirname + '/_config.yml', 'utf-8'));
const { default: toJsx } = require('./test/toJsx');
const paths = require('./config/paths');
const { default: genRoute } = require('./test/genRoute');
const Promise = require('bluebird');
const args = require('./config/cli');
require('./gulpfile.build');

/**
 * @param {Partial<{ randomize: boolean; limit: number; onBeforePostsProcess: ((posts: string[]) => string[]) | ((posts: string[]) => Promise<string[]>); clean: boolean; }>} options
 * @example
 * ```bash
 * gulp route
 * # or force options
 * gulp route --random --limit=10 --clean
 * ```
 */
async function genR(options = {}) {
  await init();
  const dest = paths.src + '/posts';
  options = Object.assign({ clean: false, limit: Infinity, randomize: false }, options || {});

  // force option clean from cli
  if (args.clean) options.clean = true;
  // force randomize from cli
  if (args.random || args.randomize) options.randomize = true;
  // force limit from cli
  if (args.limit) options.limit = parseInt(args.limit);

  if (options.clean) {
    // truncate auto generated post folder
    await fs.emptyDir(dest);
    // truncate auto generated post images folder
    await fs.emptyDir(paths.public + '/post-images');
    // truncate auto generated static html folder
    await fs.emptyDir(paths.tmp + '/static');
  }

  // let total = 0;
  const routes = [];
  let posts = require('./.cache/posts.json');
  posts = posts.filter(file => fs.existsSync(file) && fs.statSync(file).isFile());

  if (typeof options.onBeforePostsProcess === 'function') {
    // const promisify = Promise.promisify(options.onBeforePostsProcess);
    // await promisify(posts);
    const run = options.onBeforePostsProcess(posts);
    if (run.then) {
      posts = await run;
    } else {
      posts = run;
    }
  }

  if (options.randomize) {
    posts = posts.sort(() => Math.random() - 0.5);
  }

  // filter limit when post length is same or more than limit
  if (options.limit && posts.length >= options.limit) {
    posts = posts.splice(0, options.limit);
  }

  console.log('total post to be processed', posts.length);

  await Promise.all(posts)
    .each(async postPath => {
      /**
       * @type {Promise<import('hexo-post-parser').Nullable<{ route: Awaited<ReturnType<typeof genRoute>>; jsx: Awaited<ReturnType<typeof toJsx>>; value: Record<string, any>; }>>}
       */
      const route = await genRoute(postPath);
      try {
        const jsx = await toJsx({
          body: route.body,
          source: route.source,
          dest: path.join(dest, route.id)
        });
        const { body: _body, ...toPrint } = route;
        // total++;
        const value = { ...toPrint, jsxPath: jsx.jsxPath };
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
gulp.task('route', genR);
gulp.task('r', genR);

// generate posts list
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
      const w = writefile(dest, JSON.stringify(routes, null, 2));
      cache.onexit();
      console.log('map stream ends', w.file);
    });
});

// populate ./routes.json
// generate static html permalink
gulp.task('populate', done => {
  const routes = require('./routes.json');
  const template = fs.readFileSync(paths.public + '/index.html', 'utf-8');
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    if (route.permalink && route.permalink.length > 0) {
      // add index.html
      if (route.permalink.endsWith('/')) route.permalink += 'index.html';
      // add extension .html
      if (!route.permalink.endsWith('.html')) route.permalink += '.html';
      // write to temp static path
      const dest = path.join(paths.tmp, 'static', route.permalink);
      writefile(dest, template);
    }
  }
  done();
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
gulp.task('rl', () => genR({ clean: true, limit: 4 }));
gulp.task('rr', () => genR({ clean: true, limit: 4, randomize: true }));
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
