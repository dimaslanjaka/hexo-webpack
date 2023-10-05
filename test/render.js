const Hexo = require('hexo');
const path = require('upath');
const yaml = require('yaml');
const hpp = require('hexo-post-parser').default;
const fs = require('fs');

// test render single post
// need `sbg post copy`

const base = __dirname + '/..';
// const hexo = new Hexo(base, { ...yaml.parse(fs.readFileSync(base + '/_config.yml', 'utf8')), silent: true });
const hexo = new Hexo(__dirname, { ...yaml.parse(fs.readFileSync(base + '/_config.yml', 'utf8')), silent: true });

/**
 * initialize renderer
 * @param {Function} callback
 * @returns
 */
const init = callback =>
  hexo
    .init()
    .then(() => hexo.loadPlugin(require.resolve('hexo-renderers')))
    .then(() => hexo.loadPlugin(require.resolve('hexo-shortcodes')))
    .then(() => hexo.load(callback));

/**
 * @param {string} source
 * @returns {Promise<{ content: string, hexo: import('hexo') } & import('hexo-post-parser').postMeta>}
 */
async function render(source = path.join(__dirname, '/fixtures/sample.md')) {
  // parse frontmatter post
  const post = await hpp.parsePost(source);
  // render hexo shortcodes
  let { content = '' } = await hexo.post.render(null, {
    content: post.body,
    // disableNunjucks: true,
    engine: 'md'
  });
  // let { content = '' } = await hexo.post.render(source);
  // replace image src to url base64
  const imagefinderreplacement = (whole, src) => {
    // console.log(src);
    if (!src.startsWith('http')) {
      const finds = [path.join(hexo.source_dir, src), path.join(path.dirname(source), src)];
      finds.push(...finds.map(decodeURIComponent));
      // console.log(finds);
      const filter = finds.filter(fs.existsSync);
      if (filter.length > 0) {
        const file = filter[0];
        const bitmap = fs.readFileSync(file);
        // convert binary data to base64 encoded string
        const encoded =
          'data:image/' + path.extname(file).replace('.', '') + ';base64,' + Buffer.from(bitmap).toString('base64');
        return whole.replace(src, encoded);
      }
    }
  };
  try {
    const regex = /<img [^>]*src="[^"]*"[^>]*>/gm;
    if (regex.test(content)) {
      content.match(regex).map(imgTag => {
        const replacement = imgTag.replace(/.*src="([^"]*)".*/, imagefinderreplacement);
        content = content.replace(imgTag, replacement);
      });
    }
    content = content.replace(/!\[.*\]\((.*)\)/gm, imagefinderreplacement);
  } catch {
    console.log('cannot find image html from', source);
  }
  return { content, hexo, ...post.attributes };
}

if (require.main === module) {
  require('./test');
}

module.exports = { render, init };
