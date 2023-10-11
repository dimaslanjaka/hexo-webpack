import { writefile } from 'sbg-utility';
import prettierFormat from '../format';
import genRoute from '../genRoute';
import render from '../render';
import toJsx from '../toJsx';
import { fixtures, fromRoot, tmp } from '../utils';
import paths from '../../config/paths';

// need sbg post copy

render
  .init()
  .then(async () => {
    const source = fixtures('thumbnails.md');
    const result = await genRoute(source);
    const { body: _body, ...toPrint } = result;
    const jsx = await toJsx({
      body: result.body,
      dest: paths.src + '/posts',
      source,
      id: result.id || 'custom-id-thumbnails'
    });
    const value = { ...toPrint, jsxPath: jsx.jsxPath };
    const route = writefile(fromRoot('routes.json'), JSON.stringify([value], null, 2));
    const html = await prettierFormat(result.body, { parser: 'html' });
    const wh = writefile(tmp('body.html'), html);
    console.log({ jsx: jsx.jsxPath, html: wh.file, route: route.file });
  })
  .catch(console.error);
