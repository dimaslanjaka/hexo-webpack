import Hexo from 'hexo';
import hpp from 'hexo-post-parser';
import { fs, md5, path, writefile } from 'sbg-utility';
import { parse } from 'yaml';
import paths from '../config/paths';
import fixHtml from './fixHtml';
import { fixtures, fromRoot, tmp } from './utils';
import { default as htmlImg2base64 } from './utils/img2base64';
import imgfinder from './utils/imgfinder';
import extractStyleTag, { extractScriptTag, restoreScriptTag, restoreStyleTag } from './utils/extractStyleScriptTag';

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
 * render post
 * * need `init()`
 * @param source markdown source path
 * @returns {Promise<{ content: string, hexo: import('hexo') } & import('hexo-post-parser').postMeta>}
 */
export async function render(
  source = path.join(fixtures('sample.md'))
): Promise<{ content: string; hexo: import('hexo') } & import('hexo-post-parser').postMeta> {
  if (!fs.statSync(source).isFile()) throw new Error('source file is not file');
  // parse frontmatter post
  let post: Awaited<ReturnType<(typeof hpp)['parsePost']>> | ReturnType<(typeof hpp)['parsePostFM']>;
  let meta: hpp.postMeta = {} as any;
  try {
    post = await hpp.parsePost(source as string);
    if (post.metadata) meta = post.metadata;
  } catch {
    post = hpp.parsePostFM(source as string);
    if (post.attributes) meta = post.attributes as any;
  }

  if (!post.body) throw new Error('body undefined or null');

  // extract script and style tag
  let body = extractStyleTag(post.body).html;
  body = extractScriptTag(body).html;

  // render hexo shortcodes
  let { content = '' } = (await hexo.post.render(null as any, {
    content: body,
    engine: 'markdown',
    page: meta
  })) as { content: string };

  content = await fixHtml(content);

  // replace image src to url base64
  content = htmlImg2base64({ source: source as string, content });

  // local thumbnail to absolute path
  const {
    thumbnail = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/2048px-No_image_available.svg.png'
  } = meta;
  /**
   * process local image
   * @param thumbnail image source
   * @returns local image path
   */
  const imgProcess = (thumbnail: string) => {
    // process local image
    if (
      // skip base64 encoded image
      !thumbnail.startsWith('data:image') &&
      // skip external image
      !thumbnail.startsWith('http') &&
      // skip already processed image
      !thumbnail.startsWith('/post-images/')
    ) {
      // console.log('local thumb', thumbnail);
      const find = imgfinder(thumbnail);
      if (find) {
        const bitmap = fs.readFileSync(find);
        // convert binary data to base64 encoded string
        const encoded = Buffer.from(bitmap).toString('base64');
        // format to base64 encoded url string
        thumbnail = `data:image/${path.extname(find).replace(/[.]/g, '')};base64,` + encoded;
      }
    }

    // process base encoded
    if (thumbnail.startsWith('data:image')) {
      const re = /data:image\/(\w{3,4});base64,(.*)/;
      const exec = re.exec(thumbnail);
      if (exec) {
        const ext = exec[1];
        const encoded = exec[2];
        const buff = Buffer.from(encoded, 'base64');
        if (source) {
          // only process when source defined
          const imagePath = path.join(
            'post-images',
            path.basename(source, path.extname(source)),
            md5(thumbnail) + '.' + ext
          );
          const filePath = path.join(paths.public, imagePath);
          if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
          }
          fs.writeFileSync(filePath, buff);
          thumbnail = '/' + imagePath;
        }
      }
    }

    return thumbnail;
  };
  // process thumbnail
  meta.thumbnail = imgProcess(thumbnail);
  // assign empty photos property
  if (!meta.photos) meta.photos = [thumbnail];
  // collect images from body and push to meta photos
  // let m: RegExpExecArray | null;
  // const regex = /<img[^>]+src=(?:"|')(.[^">]+?)(?="|')/gm;
  // while ((m = regex.exec(content)) !== null) {
  //   // This is necessary to avoid infinite loops with zero-width matches
  //   if (m.index === regex.lastIndex) {
  //     regex.lastIndex++;
  //   }
  //   // meta.photos.push(thumbProcess(m[1]));
  //   console.log(m[1]);
  // }
  const regex = /<img [^>]*src="[^"]*"[^>]*>/gm;
  if (regex.test(content)) {
    const match = content.match(regex) || [];
    for (let i = 0; i < match.length; i++) {
      const imgTag = match[i];
      const replacement = imgTag.replace(/.*src="([^"]*)".*/, (_, src) => {
        const imgp = imgProcess(src);
        // push to meta.photos
        meta.photos?.push(imgp);
        return _.replace(src, imgp);
      });
      content = content.replace(imgTag, replacement);
      // update content
      // cm.setContent(content);
    }
  }
  // process meta photos
  meta.photos = meta.photos.map(imgProcess);
  if (!meta.permalink) {
    meta.permalink = '/' + meta.id;
    console.error('meta permalink empty', 'settled to', meta.permalink);
  }

  // restore script and style tag
  content = restoreStyleTag(content);
  content = restoreScriptTag(content);

  // write metadata to tmp/meta
  writefile(path.join(paths.tmp, 'meta', meta.id + '.json'), JSON.stringify(meta));

  // write dev server static html
  const template = fs.readFileSync(paths.public + '/index.html', 'utf-8');
  if (meta.permalink && meta.permalink.length > 0) {
    let perm = meta.permalink;
    // add index.html
    if (perm.endsWith('/')) perm += 'index.html';
    // add extension .html
    if (!perm.endsWith('.html')) perm += '.html';
    // write to temp static path
    const dest = path.join(paths.tmp, 'static', perm);
    writefile(dest, template);
  }

  return { content, hexo, ...meta };
}

export default { render, init };

if (require.main === module) {
  (async () => {
    await init();
    const source = fixtures('mixed.md');
    const { content, hexo: __, ...meta } = await render(source);
    const yaml = await import('yaml');
    const metadata = yaml.stringify(meta);
    writefile(tmp('render/metadata.yml'), metadata);
    writefile(tmp('render/content.html'), content);
  })();
}
