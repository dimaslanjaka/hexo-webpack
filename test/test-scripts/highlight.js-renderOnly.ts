import { writefile } from 'sbg-utility';
import { init, render } from '../render';
import { fixtures, tmp } from '../utils';

const main = async () => {
  await init();
  const { content } = await render(fixtures('highlight.js.md'));
  const w = writefile(tmp('render/highlight.js.html'), content);
  console.log(w.file);
};

main();
