import render from '../render';
import build from './build';

// need sbg post copy

render
  .init()
  .then(() => build('jsx-failed2'))
  .then(() => build('jsx-conflict'))
  .then(() => build('mixed'))
  .then(() => build('thumbnails'))
  .then(() => build('javascript'))
  .then(() => build('highlight.js'))
  .catch(console.error);
