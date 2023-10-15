import { md5, writefile, fs, path } from 'sbg-utility';
import { default as uuidv4 } from 'sbg-utility/dist/utils/uuid';
import { init, render } from './render';
import { tmp } from './utils';
import paths from '../config/paths';
import { restoreMarkdownCodeblockAsHtml } from './utils/extractMarkdownCodeblock';

/**
 * generate route object
 * @param source
 * @returns
 */
async function genRoute(source: string) {
  let result: import('html-webpack-plugin').Options & {
    body: string;
    source: string;
    // jsxPath: string;
    id: string;
    permalink: string;
    meta: import('html-webpack-plugin').Options['meta'];
  } = {} as any;
  // render hexo shortcodes
  const {
    title = '',
    permalink = '',
    description = '',
    excerpt = '',
    date,
    updated,
    author = 'L3n4r0x',
    lang = 'en_US',
    tags = [],
    categories = ['uncategorized'],
    thumbnail = 'https://picsum.photos/600/400/?random' + md5(source),
    id,
    contentBeforeRestoreCodeblock,
    hexo,
    ...props
  } = await render(source);

  const { content = '' } = props;
  // replace image src to url base64
  // content = img2base64({ source: source || '', content });

  const url = new URL(hexo.config.url);
  url.pathname = permalink.replace(/^\//, '');

  result = {
    ...result,
    body: content,
    title,
    filename: permalink,
    description: description || excerpt,
    source: source as string
  };

  // generate jsx
  // const jsxPath = path.join(__dirname, '/../src/posts/', id + '.jsx');
  // content = await toJsx({ source, body: content, dest: jsxPath });

  if (!result.meta)
    result.meta = {
      canonical: {
        rel: 'canonical',
        href: String(url)
      },
      og_image: {
        property: 'og:image',
        content: String(thumbnail)
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
      },
      twitter_card: {
        name: 'twitter:card',
        content: 'summary_large_image'
      },
      twitter_image: {
        name: 'twitter:image',
        content: String(thumbnail)
      }
    };

  if (date) {
    result.meta.date = {
      property: 'article:published_time',
      content: String(date)
    };
  }
  if (updated) {
    result.meta.updated = {
      property: 'article:modified_time',
      content: String(updated)
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
  const taxonomies = tags
    .concat(categories)
    .map(str => str.trim())
    .filter(str => str.length > 0);
  if (taxonomies.length > 0) {
    for (let i = 0; i < taxonomies.length; i++) {
      const label = taxonomies[i];
      result.meta['tags' + i] = {
        property: 'article:tag',
        content: label
      };
    }
  }

  // write dev server static html
  const template = fs.readFileSync(paths.public + '/index.html', 'utf-8');
  if (permalink && permalink.length > 0) {
    let perm = permalink;
    // add index.html
    if (perm.endsWith('/')) perm += 'index.html';
    // add extension .html
    if (!perm.endsWith('.html')) perm += '.html';
    // write to temp static path
    const dest = path.join(paths.tmp, 'static', perm);
    let contentStatic = template;
    contentStatic = contentStatic.replace('</head>', '<script defer src="/runtime/main.js"></script></head>');
    const postBody = restoreMarkdownCodeblockAsHtml(contentBeforeRestoreCodeblock);
    contentStatic = contentStatic.replace('<div id="root"></div>', '<div id="root">' + postBody + '</div>');
    writefile(dest, contentStatic);
  }

  return { ...result, permalink, id };
}

export default genRoute;

if (require.main === module) {
  (async () => {
    await init();
    const result = await genRoute(__dirname + '/fixtures/jsx-conflict.md');
    writefile(tmp('genRoute/result.html'), result.body);
    const { body: _body, ...props } = result;
    writefile(tmp('genRoute/result.json'), { ...props });
  })();
}
