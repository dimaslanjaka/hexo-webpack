import { path } from 'sbg-utility';
import render from '../render';
import genRoute from '../genRoute';

const file = path.join(process.cwd(), 'src-posts/2019/12/related-post-blogger-support-webp.md');

render.init().then(() => {
  // render.render(file).then(rendered => {
  //   console.log(rendered.content);
  // });
  genRoute(file).then(rendered => {
    console.log('render', rendered);
  });
  // .catch(console.error);
});
