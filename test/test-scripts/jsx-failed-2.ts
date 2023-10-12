import render from '../render';
import build from './build';

render
  .init()
  .then(() => build('jsx-failed2'))
  .catch(console.error);
