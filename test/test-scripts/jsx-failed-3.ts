import render from '../render';
import build, { pruneFolders } from './build';

render
  .init()
  .then(() => pruneFolders())
  .then(() => build('jsx-failed3'))
  .catch(console.error);
