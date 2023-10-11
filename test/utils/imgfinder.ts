import { fs, path } from 'sbg-utility';
import paths from '../../config/paths';

const configJson = path.resolve(__dirname, '../../_config.json');
let config = {} as import('hexo')['config'] & { post_dir: string };
if (fs.existsSync(configJson)) {
  config = JSON.parse(fs.readFileSync(configJson, 'utf-8'));
}

/**
 * find image by given string
 * @param src image path string
 * @param includePaths add more folder to search
 * @returns
 */
export default function imgfinder(src: string, includePaths?: string[] | string) {
  const finds = [
    // path.join(path.dirname(source), src),
    path.join(paths.src, src),
    path.join(paths.public, src),
    path.join(paths.cwd, src),
    path.join(config.post_dir, src),
    path.join(paths.cwd, config.post_dir, src),
    path.join(config.source_dir, src),
    path.join(paths.cwd, config.source_dir, src)
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
  return filter[0] ? path.resolve(filter[0]) : undefined;
}

if (require.main === module) {
  (async () => {
    const find = imgfinder('/The Legend Of Neverland/Quiz/SCENIC-QUIZ.jpg');
    console.log({ find });
  })();
}
