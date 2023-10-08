import { path, writefile } from 'sbg-utility';
import paths from '../config/paths';
import '../src/utils/promise';
import genRoute from './genRoute';
import render from './render';
import toJsx from './toJsx';
import { glob } from 'glob';

// test render single post
// need `sbg post copy`

async function _all() {
  const sourcePostDir = __dirname + '/../source/_posts';
  const { config } = await render.init();
  const posts = await glob('**/*.md', {
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
  }).map(result => path.resolve(sourcePostDir, result));
  const results = await Promise.all(posts)
    .map(genRoute)
    .map(route => toJsx({ body: route.body, source: route.source, dest: path.join(paths.src, 'posts', route.id) }))
    .filter(result => typeof result !== 'undefined');
  console.log('total posts', results.length);
  writefile(__dirname + '/../routes.json', JSON.stringify(results, null, 2));
}

_all().catch(console.error);
