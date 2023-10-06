const glob = require('glob');
const { writefile, path } = require('sbg-utility');
const render = require('./render');
const Promise = require('bluebird');
const genRoute = require('./genRoute');

// test render single post
// need `sbg post copy`

async function _all() {
  const sourcePostDir = __dirname + '/../source/_posts';
  const { config } = await render.init();
  const posts = glob
    .sync('**/*.md', {
      cwd: sourcePostDir,
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
      ],
      dot: true
    })
    .map(result => path.resolve(sourcePostDir, result));
  const results = await Promise.all(posts.map(genRoute))
    .filter(result => typeof result !== 'undefined')
    .catch(console.error);
  console.log('total posts', results.length);
  writefile(__dirname + '/../routes.json', JSON.stringify(results, null, 2));
}

_all().catch(console.error);
