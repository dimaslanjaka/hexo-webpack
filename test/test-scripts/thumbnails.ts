import { init } from '../render';
import build from './build';

// need sbg post copy

init().then(() => build('thumbnails'));
