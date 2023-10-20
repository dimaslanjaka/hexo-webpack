import Hexo from 'hexo';
import hpp, { parsePermalink } from 'hexo-post-parser';
import { gistEmbedTagRegister } from 'hexo-shortcodes/dist/gist';
import { githubEmbedTagRegister } from 'hexo-shortcodes/dist/github';
import { shortcodeParser, shortcodeParserResultToArrayAttrParam } from 'hexo-shortcodes/dist/utils';
import safelinkify from 'safelinkify';
import { fs, md5, path, writefile } from 'sbg-utility';
import paths from '../config/paths';
import { _config } from './constants';
import fixHtml from './fixHtml';
import { fixtures, fromRoot, tmp } from './utils';
import { extractMarkdownCodeblock, restoreMarkdownCodeblock } from './utils/extractMarkdownCodeblock';
import { Extractor } from './utils/extractStyleScriptTag';
import { default as htmlImg2base64 } from './utils/img2base64';
import imgfinder from './utils/imgfinder';

// test render single post
// need `sbg post copy`

const base = path.resolve(__dirname, '..');
const hexo = new Hexo(__dirname, { ..._config, silent: true });

// initializer external anchor/hyperlink anonymizer
const safelinkConfig = _config.external_link.safelink;
const sf = new safelinkify.safelink({
  exclude: safelinkConfig.exclude,
  password: safelinkConfig.password,
  type: safelinkConfig.type,
  redirect: safelinkConfig.redirect
});

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
      if (!configWritten) {
        configWritten = true;
        writefile(
          fromRoot('_config.json'),
          JSON.stringify({ ...hexo.config, base_dir: path.toUnix(base), paths: _paths }, null, 2)
        );
      }
      hexo.load(() => typeof callback == 'function' && callback(hexo));
      return hexo;
    });

let configWritten = false;

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

  let { body = '' } = post;

  // parse custom gist, github shortcodes
  // append new config - if not settled in _config.yml
  // hexo.config = Object.assign(hexo.config || {}, { 'hexo-shortcodes': { raw: true } });
  // prepare renderer
  const parserGithub = githubEmbedTagRegister(hexo);
  const parserGist = gistEmbedTagRegister(hexo);

  const rgist = /{%\s(gist|github)\s([^%}]+)%}/m;
  let mg: RegExpExecArray | null;
  while ((mg = rgist.exec(body)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (mg.index === rgist.lastIndex) {
      rgist.lastIndex++;
    }

    let replacement = '';
    const parse = shortcodeParser(mg[0]);
    const arr = shortcodeParserResultToArrayAttrParam(parse);
    if (parse.tagName === 'github') {
      const git = await parserGithub(arr);
      replacement = git;
    } else if (parse.tagName === 'gist') {
      const git = await parserGist(arr);
      replacement = git;
    }

    body = body.replace(mg[0], replacement);
  }

  // extract markdown codeblocks
  body = extractMarkdownCodeblock(body).html;

  const extractor = new Extractor(body);
  // extract script and style tag
  extractor.extractStyleTag();
  extractor.extractScriptTag();
  // extract <ins/>
  extractor.extractTag('ins');
  // re-assign extracted tags result
  body = extractor.getHtml();

  // dump
  // writefile(__dirname + '/tmp/render/after-extract.html', body);

  // render hexo shortcodes
  let { content = '' } = (await hexo.post.render(null as any, {
    content: body,
    engine: 'markdown',
    page: meta
  })) as { content: string };

  content = await fixHtml(content);

  // anonimize hyperlink using safelinkify
  const rA = /<a[^>]*>([^<]+)<\/a>/gm;
  content = content.replace(rA, function (outer) {
    const rH = /<a[^>]+href=(?:"|')(.[^">]+?)(?="|')/;
    const m = outer.match(rH);
    let href = undefined as string | undefined;
    if (m) {
      href = m[1];
      if (href.startsWith('http') && !href.includes(safelinkConfig.redirect)) {
        // console.log(href);
        const anonymize = sf.parseUrl(href);
        if (typeof anonymize === 'string') {
          outer = outer.replace(href, anonymize.trim());
        }
      }
    }
    // return original string
    return outer;
  });

  // replace image src to url base64
  content = htmlImg2base64({ source: source as string, content });

  // local thumbnail to absolute path
  const { thumbnail = 'https://picsum.photos/600/400/?random=' + md5(source) } = meta;
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
    }
  }
  // process meta photos
  meta.photos = meta.photos.map(imgProcess);
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

  // re-assign modified content into extractor
  extractor.setHtml(content);
  // restore <ins/>
  extractor.restoreTag('ins');

  // restore script and style tag
  extractor.restoreStyleTag();
  extractor.restoreScriptTag();

  // re-assign restored tags
  content = extractor.getHtml();

  const contentBeforeRestoreCodeblock = content;
  // restore markdown codeblock
  // keep raw markdown codeblock to be processed at toJsx.ts
  content = restoreMarkdownCodeblock(content);

  // dump
  // writefile(__dirname + '/tmp/render/after-restore.html', body);

  // write metadata to tmp/meta
  writefile(path.join(paths.tmp, 'meta', meta.id + '.json'), JSON.stringify(meta));

  return { content, contentBeforeRestoreCodeblock, hexo, ...meta };
}

export default { render, init };

if (require.main === module) {
  (async () => {
    const yaml = await import('yaml');
    await init();
    const source = fixtures('mixed.md');
    const start = Date.now();
    const { content, hexo: __, ...meta } = await render(source);
    const end = Date.now();
    console.log(`Execution time: ${end - start} ms`);
    console.log('render result should not have replacement tags', !/htmlFor=["'].*["'] data-index/gim.test(content));
    const metadata = yaml.stringify(meta);
    const ml = writefile(tmp('render/metadata.yml'), metadata);
    const cl = writefile(tmp('render/content.html'), content);
    console.log({ meta: ml.file, content: cl.file });
  })();
}
