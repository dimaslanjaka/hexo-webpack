import { writefile } from 'sbg-utility';
import prettierFormat from './format';
import genRoute from './genRoute';
import render from './render';
import toJsx from './toJsx';
import { fixtures, tmp } from './utils';

render
  .init()
  .then(async () => {
    const source = fixtures('jsx-conflict.md');
    const result = await genRoute(source);
    writefile(__dirname + '/../routes.json', JSON.stringify([result], null, 2));
    const jsx = await toJsx({ body: result.body, dest: tmp('test-jsx'), source });
    const html = await prettierFormat(result.body, { parser: 'html' });
    writefile(__dirname + '/tmp/body.html', html);
    console.log('jsx', jsx.jsxPath);
  })
  .catch(console.error);
