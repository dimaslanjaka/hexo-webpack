import { path, writefile, fs } from 'sbg-utility';
import paths from '../../config/paths';
import prettierFormat from '../format';
import genRoute from '../genRoute';
import toJsx from '../toJsx';
import { fixtures, fromRoot, tmp } from '../utils';
import { Route } from '../../src/project';

const routes = [] as Route[];
const folders = ['src/posts', 'tmp/meta', 'tmp/static', 'public/post-images'];

/** prune auto generated folders */
export const pruneFolders = () =>
  folders
    .map(p => path.join(paths.cwd, p))
    .filter(p => fs.existsSync(p))
    .forEach(p => fs.emptyDirSync(p));

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
  const value = { ...toPrint, jsxPath: jsxResult.jsxPath } as Route;
  routes.push(value);

  const route = writefile(fromRoot('routes.json'), JSON.stringify(routes, null, 2));
  const html = await prettierFormat(renderResult.body, { parser: 'html' });
  const wh = writefile(tmp('html/' + filename + '.html'), html);
  console.log({ jsx: jsxResult.jsxPath, html: wh.file, route: route.file });
  return { jsxResult, renderResult, route: value, source };
}

export default build;
