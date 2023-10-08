import { writefile } from 'sbg-utility';
import prettierFormat from '../format';
import genRoute from '../genRoute';
import render from '../render';
import toJsx from '../toJsx';
import { fixtures, fromRoot, tmp } from '../utils';
import path from 'path';

const routes: any[] = [];

const build = async (filename: string) => {
  const source = fixtures(filename);
  const route = await genRoute(source);
  routes.push(route);
  const routeJson = writefile(fromRoot('routes.json'), JSON.stringify(routes, null, 2));
  const html = await prettierFormat(route.body, { parser: 'html' });
  const basename = path.basename(filename, path.extname(filename));
  const jsx = await toJsx({ body: route.body, dest: tmp(basename), source });
  const wh = writefile(tmp(basename + '.html'), html);
  console.log({ jsx: jsx.jsxPath, html: wh.file, route: routeJson.file });
};

render
  .init()
  .then(() => build('jsx-failed.md'))
  .then(() => build('jsx-conflict.md'))
  .then(() => build('mixed.md'))
  .catch(console.error);
