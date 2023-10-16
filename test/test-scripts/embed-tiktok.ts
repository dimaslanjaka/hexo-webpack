import render from '../render';
import build, { pruneFolders } from './build';

render
  .init()
  .then(() => pruneFolders())
  .then(() => build('embed-tiktok'))
  .catch(console.error);
