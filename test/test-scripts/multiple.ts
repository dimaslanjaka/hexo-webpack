import render from '../render';
import build from './build';

// need sbg post copy

render
  .init()
  .then(() => build('jsx-failed'))
  .then(() => build('jsx-conflict'))
  .then(() => build('mixed'))
  .then(() => build('thumbnail'))
  .catch(console.error);
