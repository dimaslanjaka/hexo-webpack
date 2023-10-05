const path = require('path');
const glob = require('glob');
const { writefile } = require('sbg-utility');
const render = require('./render');
const Promise = require('bluebird');

// test render single post
// need `sbg post copy`

async function _all() {
  const sourcePostDir = __dirname + '/../source/_posts';
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
        '**/.frontmatter'
      ],
      dot: true
    })
    .map(result => path.resolve(sourcePostDir, result));
  await render.init();
  const results = await Promise.all(posts.map(genRoute));
  console.log('total posts', results.length);
  writefile(__dirname + '/../routes.json', JSON.stringify(results, null, 2));
}

async function genRoute(source) {
  try {
    // render hexo shortcodes
    const {
      content = '',
      title = '',
      permalink = '',
      description = '',
      excerpt = '',
      date,
      updated,
      author = 'L3n4r0x',
      lang = 'en_US',
      tags = [],
      hexo
    } = await render.render(source);

    /** @type {import('html-webpack-plugin').Options & { body: string, source: string }} */
    const result = {
      body: content,
      title,
      filename: permalink,
      description: description || excerpt,
      meta: {
        canonical: {
          rel: 'canonical',
          href: hexo.config.url + '/' + permalink.replace(/^\//, '')
        },
        og_url: {
          property: 'og:url',
          content: hexo.config.url + '/' + permalink.replace(/^\//, '')
        },
        og_type: {
          property: 'og:type',
          content: 'article'
        }
      },
      source
    };

    if (date) {
      result.meta.date = {
        property: 'article:published_time',
        content: date
      };
    }
    if (updated) {
      result.meta.updated = {
        property: 'article:modified_time',
        content: updated
      };
    }
    if (author) {
      if (typeof author === 'string') {
        result.meta.author = {
          property: 'article:author',
          content: author
        };
      } else if (author.name) {
        result.meta.author = {
          property: 'article:author',
          content: author.name
        };
      }
    }
    if (lang) {
      result.meta.language = {
        httpEquiv: 'Content-Language',
        content: lang
      };
      result.meta.og_locale = {
        httpEquiv: 'og:locale',
        content: lang
      };
    }
    if (tags && tags.length > 0) {
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        result.meta['tags' + i] = {
          property: 'article:tag',
          content: tag
        };
      }
    }
    return result;
  } catch (e) {
    console.error(e);
  }
}

// render.init().then(() => {
//   genRoute(__dirname + '/shortcodes.md')
//     .then(result => {
//       writefile(__dirname + '/../routes.json', JSON.stringify([result], null, 2));
//       writefile(__dirname + '/../tmp/body.md', result.body);
//     })
//     .catch(console.error);
// });

_all().then(() => {
  //
});
