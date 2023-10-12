import { path, writefile } from 'sbg-utility';
import paths from '../../config/paths';
import prettierFormat from '../format';
import genRoute from '../genRoute';
import toJsx from '../toJsx';
import { fixtures, fromRoot, tmp } from '../utils';

const routes = [] as any[];

/**
 * need render.init() before run this function
 * @param filename
 * @returns
 */
async function build(filename: string) {
  try {
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
    const { jsx, result } = await { jsx: jsxResult, result: renderResult };
    const route = writefile(fromRoot('routes.json'), JSON.stringify(routes, null, 2));
    const html = await prettierFormat(result.body, { parser: 'html' });
    const wh = writefile(tmp('html/' + filename + '.html'), html);
    console.log({ jsx: jsx.jsxPath, html: wh.file, route: route.file });
  } catch (message_1) {
    return console.error(message_1);
  }
}

export default build;
