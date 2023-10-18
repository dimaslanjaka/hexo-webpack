import render from '../render';
import build from './build';

render
  .init()
  .then(() => build('shortcodes'))
  .catch(console.error);
