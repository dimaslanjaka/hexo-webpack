const { writefile, path } = require('sbg-utility');
const render = require('./render');
const toJsx = require('./toJsx');
const { default: uuidv4 } = require('sbg-utility/dist/utils/uuid');

/**
 * generate route object
 * @param {string} source
 * @returns
 */
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
      id,
      hexo
    } = await render.render(source);

    const url = new URL(hexo.config.url);
    url.pathname = permalink.replace(/^\//, '');

    /** @type {import('html-webpack-plugin').Options & { body: string, source: string }} */
    const result = {
      body: content,
      title,
      filename: permalink,
      description: description || excerpt,
      meta: {
        canonical: {
          rel: 'canonical',
          href: String(url)
        },
        og_url: {
          property: 'og:url',
          content: String(url)
        },
        og_type: {
          property: 'og:type',
          content: 'article'
        },
        id: {
          property: 'article:id',
          content: id || uuidv4(title)
        }
      },
      source
    };

    // generate jsx
    const jsx = await toJsx(result.body);
    const jsxPath = path.join(__dirname, '/../src/posts/', id + '.jsx');
    writefile(jsxPath, jsx);

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
    return { ...result, jsxPath, permalink };
  } catch (e) {
    console.error('cannot parse', source);
  }
}

module.exports = genRoute;

if (require.main === module) {
  require('./test-jsx');
}
