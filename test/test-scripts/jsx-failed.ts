import { writefile } from 'sbg-utility';
import prettierFormat from '../format';
import genRoute from '../genRoute';
import render from '../render';
import toJsx from '../toJsx';
import { fixtures, fromRoot, tmp } from '../utils';

render
  .init()
  .then(async () => {
    const source = fixtures('jsx-failed.md');
    const result = await genRoute(source);
    const route = writefile(fromRoot('routes.json'), JSON.stringify([result], null, 2));
    const html = await prettierFormat(result.body, { parser: 'html' });
    const jsx = await toJsx({ body: result.body, dest: tmp('jsx-failed'), source });
    const wh = writefile(tmp('body.html'), html);
    console.log({ jsx: jsx.jsxPath, html: wh.file, route: route.file });
  })
  .catch(console.error);
