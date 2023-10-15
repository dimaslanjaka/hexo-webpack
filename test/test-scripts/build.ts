import { path, writefile, fs } from 'sbg-utility';
import paths from '../../config/paths';
import prettierFormat from '../format';
import genRoute from '../genRoute';
import toJsx from '../toJsx';
import { fixtures, fromRoot, tmp } from '../utils';

const routes = [] as any[];
const postDir = path.join(paths.src, 'posts');
// empty post dir
fs.emptyDirSync(postDir);

/**
 * need render.init() before run this function
 * @param filename
 * @returns
 */
async function build(filename: string) {
  const source = fixtures(filename + '.md');
  const renderResult = await genRoute(source);
  const { body: _body, ...toPrint } = renderResult;
  const jsxResult = await toJsx({
    body: renderResult.body,
    dest: path.join(paths.src, 'posts', renderResult.id),
    source,
    id: renderResult.id || 'custom-id-' + filename
  });
  const value = { ...toPrint, jsxPath: jsxResult.jsxPath };
  routes.push(value);

  const route = writefile(fromRoot('routes.json'), JSON.stringify(routes, null, 2));
  const html = await prettierFormat(renderResult.body, { parser: 'html' });
  const wh = writefile(tmp('html/' + filename + '.html'), html);
  console.log({ jsx: jsxResult.jsxPath, html: wh.file, route: route.file });
}

export default build;
