import Hexo from 'hexo';
import hpp from 'hexo-post-parser';
import { RenderMarkdownBody } from 'hexo-post-parser/dist/markdown/renderBodyMarkdown';
import { fs, path, writefile } from 'sbg-utility';
import { parse } from 'yaml';
import fixHtml from './fixHtml';
import { default as img2base64 } from './utils/img2base64';
import { fixtures, fromRoot } from './utils';
import paths from '../config/paths';

// test render single post
// need `sbg post copy`

const base = path.resolve(__dirname, '..');
const _config = parse(fs.readFileSync(base + '/_config.yml', 'utf8'));
// const hexo = new Hexo(base, { ...yaml.parse(fs.readFileSync(base + '/_config.yml', 'utf8')), silent: false });
const hexo = new Hexo(__dirname, { ..._config, silent: true });

/**
 * initialize renderer
 * @param callback
 * @returns
 */
export const init = (callback?: (hexo: import('hexo')) => any) =>
  hexo
    .init()
    .then(() => hexo.loadPlugin(require.resolve('hexo-renderers')))
    .then(() => hexo.loadPlugin(require.resolve('hexo-shortcodes')))
    .then(() => {
      hexo.config = { ...hexo.config, ..._config };
      const _paths = paths;
      for (const key in paths) {
        const value = paths[key];
        if (value) {
          if (typeof value === 'string') {
            _paths[key] = path.toUnix(value);
          } else if (Array.isArray(value)) {
            // value is array
          } else if (typeof value == 'object') {
            // value is object
            for (const kv in value) {
              const val = value[kv];
              value[kv] = path.toUnix(val);
            }
            // re-assign modified value
            _paths[key] = value;
          }
        }
      }
      writefile(
        fromRoot('_config.json'),
        JSON.stringify({ ...hexo.config, base_dir: path.toUnix(base), paths: _paths }, null, 2)
      );
      hexo.load(() => typeof callback == 'function' && callback(hexo));
      return hexo;
    });

/**
 * @param source
 * @returns {Promise<{ content: string, hexo: import('hexo') } & import('hexo-post-parser').postMeta>}
 */
export async function render(
  source: import('hexo-post-parser').Nullable<string> = path.join(fixtures('sample.md'))
): Promise<{ content: string; hexo: import('hexo') } & import('hexo-post-parser').postMeta> {
  // parse frontmatter post
  let post: Awaited<ReturnType<(typeof hpp)['parsePost']>> | ReturnType<(typeof hpp)['parsePostFM']>;
  let meta: hpp.postMeta = {} as any;
  try {
    post = await hpp.parsePost(source as string);
    if (post.metadata) meta = post.metadata;
  } catch {
    post = hpp.parsePostFM(source as string);
    if (post.attributes) meta = post.attributes;
  }
  const cm = new RenderMarkdownBody(post as any);
  // extract style, script
  cm.extractStyleScript();

  // render hexo shortcodes
  let { content = '' } = await hexo.post.render(null as any, {
    content: cm.getContent(),
    engine: 'md',
    page: meta
  });

  // update content
  cm.setContent(content);
  // writefile(tmp('render/after-render.html'), content);

  // extract code block first
  cm.extractCodeBlock();

  // writefile(tmp('render/extracted-codeblock.json'), cm.getExtractedCodeblock());
  // writefile(tmp('render/extracted-stylescript.json'), cm.getExtractedStyleScript());
  content = await fixHtml(cm.getContent());
  cm.setContent(content);
  // writefile(tmp('render/after-extract.html'), content);

  // replace image src to url base64
  content = img2base64({ source: source as string, content });

  // restore codeblock
  cm.restoreCodeBlock();
  // restore style script
  cm.restoreStyleScript();

  return { content: cm.getContent(), hexo, ...meta };
}

export default { render, init };
