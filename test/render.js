const Hexo = require('hexo');
const yaml = require('yaml');
const hpp = require('hexo-post-parser').default;
const { fs, path } = require('sbg-utility');

// test render single post
// need `sbg post copy`

const base = path.resolve(__dirname, '..');
const _config = yaml.parse(fs.readFileSync(base + '/_config.yml', 'utf8'));
// const hexo = new Hexo(base, { ...yaml.parse(fs.readFileSync(base + '/_config.yml', 'utf8')), silent: false });
const hexo = new Hexo(__dirname, { ..._config, silent: true });

/**
 * initialize renderer
 * @param {(hexo: import('hexo')) => any} [callback]
 * @returns
 */
const init = callback =>
  hexo
    .init()
    .then(() => hexo.loadPlugin(require.resolve('hexo-renderers')))
    .then(() => hexo.loadPlugin(require.resolve('hexo-shortcodes')))
    .then(() => {
      hexo.config = { ...hexo.config, ..._config };
      fs.writeFileSync(
        __dirname + '/../_config.json',
        JSON.stringify({ ...hexo.config, base_dir: path.toUnix(base) }, null, 2)
      );
      hexo.load(() => typeof callback == 'function' && callback(hexo));
      return hexo;
    });

/**
 * @param {string} source
 * @returns {Promise<{ content: string, hexo: import('hexo') } & import('hexo-post-parser').postMeta>}
 */
async function render(source = path.join(__dirname, '/fixtures/sample.md')) {
  // parse frontmatter post
  const post = (await hpp.parsePost(source)) || hpp.parsePostFM(source);
  const meta = post.attributes ? post.attributes : post.metadata;

  // render hexo shortcodes
  let { content = '' } = await hexo.post.render(null, {
    content: post.body,
    engine: 'md',
    page: meta
  });

  // console.log({ content });

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

  return { content, hexo, ...meta };
}

module.exports = { render, init };

if (require.main === module) {
  require('./test');
}
