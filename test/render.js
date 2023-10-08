const Hexo = require('hexo');
const yaml = require('yaml');
const hpp = require('hexo-post-parser').default;
const { fs, path, writefile } = require('sbg-utility');
const { RenderMarkdownBody } = require('hexo-post-parser/dist/markdown/renderBodyMarkdown');
const { tmp } = require('./utils');
const fixHtml = require('./fixHtml');
const { default: img2base64 } = require('./utils/img2base64');

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
      writefile(
        __dirname + '/../_config.json',
        JSON.stringify({ ...hexo.config, base_dir: path.toUnix(base) }, null, 2)
      );
      hexo.load(() => typeof callback == 'function' && callback(hexo));
      return hexo;
    });

/**
 * @param {import('hexo-post-parser').Nullable<string>} [source]
 * @returns {Promise<{ content: string, hexo: import('hexo') } & import('hexo-post-parser').postMeta>}
 */
async function render(source = path.join(__dirname, '/fixtures/sample.md')) {
  // parse frontmatter post
  const post = (await hpp.parsePost(source)) || hpp.parsePostFM(source);
  const meta = post.attributes ? post.attributes : post.metadata;
  const cm = new RenderMarkdownBody(post);
  // extract style, script
  cm.extractStyleScript();

  // render hexo shortcodes
  let { content = '' } = await hexo.post.render(null, {
    content: cm.getContent(),
    engine: 'md',
    page: meta
  });

  // update content
  cm.setContent(content);
  writefile(tmp('render/after-render.html'), content);

  // extract code block first
  cm.extractCodeBlock();

  writefile(tmp('render/extracted-codeblock.json'), cm.getExtractedCodeblock());
  writefile(tmp('render/extracted-stylescript.json'), cm.getExtractedStyleScript());
  content = await fixHtml(cm.getContent());
  cm.setContent(content);
  writefile(tmp('render/after-extract.html'), content);

  // replace image src to url base64
  content = img2base64({ source, content });

  // restore codeblock
  cm.restoreCodeBlock();
  // restore style script
  cm.restoreStyleScript();

  return { content: cm.getContent(), hexo, ...meta };
}

module.exports = { render, init };

if (require.main === module) {
  require('./test');
}
