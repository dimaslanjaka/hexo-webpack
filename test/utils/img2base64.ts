import { fs, path, writefile } from 'sbg-utility';
import { fixtures, tmp } from '.';
import paths from '../../config/paths';

interface Options {
  /** source markdown absolute path */
  source: string;
  /** content body markdown */
  body?: string;
  content?: string;
}

function img2base64(options: Options) {
  const { source, body, content: body2 } = options;
  // fallback content
  let content = body || body2 || '';
  const imagefinderreplacement: (substring: string, ...args: string[]) => string = (whole: string, src: string) => {
    // process non-http and base64 image
    if (!src.startsWith('http') && !src.startsWith('data:image/')) {
      const finds = [
        path.join(path.dirname(source), src),
        path.join(paths.src, src),
        path.join(paths.public, src),
        path.join(paths.base, src)
      ];
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
    // return back original string
    return whole;
  };
  const regex = /<img [^>]*src="[^"]*"[^>]*>/gm;
  if (regex.test(content)) {
    content.match(regex)?.map(imgTag => {
      const replacement = imgTag.replace(/.*src="([^"]*)".*/, imagefinderreplacement);
      content = content.replace(imgTag, replacement);
    });
  }
  content = content.replace(/!\[.*\]\((.*)\)/gm, imagefinderreplacement);
  return content;
}

export default img2base64;

if (require.main === module) {
  (async () => {
    const source = fixtures('toJsx.html');
    const convert = img2base64({ source, body: fs.readFileSync(source, 'utf-8') });
    writefile(tmp('img2base64.html'), convert);
  })();
}
