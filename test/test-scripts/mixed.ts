import render from '../render';
import build from './build';

render
  .init()
  .then(() => build('mixed'))
  .catch(console.error);
