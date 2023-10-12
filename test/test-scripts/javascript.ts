import render from '../render';
import build from './build';

render
  .init()
  .then(() => build('javascript'))
  .catch(console.error);
