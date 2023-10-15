import render from '../render';
import build from './build';

render
  .init()
  .then(() => build('highlight.js'))
  .catch(console.error);
