import { fs, path } from 'sbg-utility';
import paths from '../../config/paths';

const configJson = path.resolve(__dirname, '../../_config.json');
let config = {} as import('hexo')['config'] & { post_dir: string };
if (fs.existsSync(configJson)) {
  config = JSON.parse(fs.readFileSync(configJson, 'utf-8'));
}

const pj = (...args: (string | null | undefined)[]) => args.join('/');

/**
 * find image by given string
 * @param src image path string
 * @param includePaths add more folder to search
 * @returns
 */
export default function imgfinder(src: string | null | undefined, includePaths?: string[] | string) {
  if (!src || src.length == 0) return undefined;
  const finds = [
    pj(path.dirname(src), src),
    pj(paths.src, src),
    pj(paths.public, src),
    pj(paths.cwd, src),
    pj(config.post_dir, src),
    pj(paths.cwd, config.post_dir, src),
    pj(config.source_dir, src),
    pj(paths.cwd, config.source_dir, src)
  ];
  if (includePaths) {
    const addPaths = (sources: string[]) => sources.map(source => path.join(path.dirname(source), src));
    if (Array.isArray(includePaths)) {
      finds.push(...addPaths(includePaths));
    } else {
      finds.push(...addPaths([includePaths]));
    }
  }
  finds.push(...finds.map(decodeURIComponent));
  const filter = finds.filter(fs.existsSync);
  return filter[0] ? path.toUnix(path.resolve(filter[0])) : undefined;
}

if (require.main === module) {
  (async () => {
    const find = imgfinder('/The Legend Of Neverland/Quiz/SCENIC-QUIZ.jpg');
    console.log({ find });
  })();
}
