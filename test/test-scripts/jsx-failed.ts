import render from '../render';
import build from './build';

render
  .init()
  .then(() => build('jsx-failed'))
  .catch(console.error);
