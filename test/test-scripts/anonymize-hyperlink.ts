import render from '../render';
import build, { pruneFolders } from './build';

render
  .init()
  .then(() => pruneFolders())
  .then(() => build('anonymize-hyperlink'))
  .catch(console.error);
