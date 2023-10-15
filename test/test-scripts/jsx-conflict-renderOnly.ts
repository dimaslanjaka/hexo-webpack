import { writefile } from 'sbg-utility';
import { init, render } from '../render';
import { fixtures, tmp } from '../utils';

const main = async () => {
  await init();
  const { content } = await render(fixtures('jsx-conflict.md'));
  const w = writefile(tmp('render/jsx-conflict.html'), content);
  console.log(w.file);
};

main();
