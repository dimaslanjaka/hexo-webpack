const { path, fs, writefile, jsonStringifyWithCircularRefs, jsonParseWithCircularRefs } = require('sbg-utility');
const glob = require('glob');
const { parsePostFM, parsePermalink } = require('hexo-post-parser');
const { init } = require('./render');
const { rendererMarkdownIt } = require('hexo-renderers');
const Bluebird = require('bluebird');
const paths = require('../config/paths');
const prettierFormat = require('./format');
const { default: toJsx } = require('./toJsx');
const { default: fixHtml } = require('./fixHtml');
const { default: uuidv4 } = require('sbg-utility/dist/utils/uuid');
const { _config } = require('./constants');

/** cached json post list path */
const dataPath = path.join(paths.tmp, 'test/postList.json');
/** source post directory */
const post_dir = path.join(__dirname, '../src-posts');

/**
 * @type {{parsed: ReturnType<typeof parsePostFM>; source: string;}[]}
 */
let posts = [];

if (!fs.existsSync(dataPath)) {
  posts = glob
    .sync('**/*.md', {
      cwd: post_dir,
      ignore: ['**/node_modules/**', 'changelog.md', 'readme.md', 'index.md'].concat(_config.exclude)
    })
    .map(p => {
      const source = path.join(post_dir, p);
      const parsed = parsePostFM(source);

      const { attributes: meta } = parsed;
      if (!meta.id) meta.id = uuidv4(meta.title);
      // set permalink
      if (!meta.permalink) {
        let perm = path.toUnix(
          parsePermalink(source, {
            url: _config.url,
            title: _config.title,
            date: String(meta.date || new Date()),
            permalink: _config.permalink
          })
        );
        // fix absolute path in permalink
        [
          path.join(paths.cwd, _config.source_dir, '_posts'),
          path.join(paths.cwd, _config.source_dir),
          path.join(paths.cwd, 'test/fixtures'),
          path.join(paths.cwd, _config.post_dir || 'src-posts')
        ]
          .filter(p => perm.includes(p))
          .forEach(p => (perm = perm.replace(p, '')));
        meta.permalink = perm;
        console.error('meta permalink empty', 'settled to', perm);
      }
      // write metadata to tmp/meta
      writefile(path.join(paths.tmp, 'meta', meta.id + '.json'), JSON.stringify(meta));

      return { source, parsed };
    });

  Bluebird.all(posts).then(posts => {
    writefile(dataPath, jsonStringifyWithCircularRefs(posts));
  });
} else {
  posts = jsonParseWithCircularRefs(fs.readFileSync(dataPath, 'utf-8'));
}

// posts.filter(({ source, parsed }) => {
//   const { body } = parsed;
//   if (/dir=['"]ltr['"]/gm.test(body)) {
//     if (/{% /gm.test(body)) {
//       console.log('post with html body has shortcode', source);
//       return false;
//     }
//     return true;
//   }
//   return false;
// });

init().then(hexo => {
  const renderer = rendererMarkdownIt(hexo);
  Bluebird.all(posts)
    .map(async post => {
      const { body, attributes: meta } = post.parsed;
      const rendered = renderer({ text: body }, { page: meta });
      try {
        const format = await prettierFormat(rendered, { parser: 'html' });
        return { ...post, rendered, format };
      } catch {
        try {
          const fix = await fixHtml(rendered);
          const format = await prettierFormat(fix, { parser: 'html' });
          return { ...post, rendered, format };
        } catch {
          console.log('fail format', post.source);
          return { ...post, rendered };
        }
      }
    })
    .filter(o => 'format' in o)
    .each(async post => {
      const {
        content: _,
        scriptContent: __,
        styleContent: ___,
        ..._jsx
      } = await toJsx({
        body: post.format,
        dest: paths.src + '/posts/' + post.parsed.attributes.id,
        source: post.source,
        id: post.parsed.attributes.id
      });
    });
});
