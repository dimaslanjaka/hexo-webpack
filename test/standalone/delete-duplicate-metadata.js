const glob = require('glob');
const { join } = require('path');
const { writefile } = require('sbg-utility');
const Bluebird = require('bluebird');
const { parsePostFM } = require('hexo-post-parser');
const yaml = require('yaml');
const paths = require('../../config/paths');

// remove duplicate / unused metadata

const cwd = paths.cwd;
Bluebird.all(glob.glob('src-posts/**/*.md', { ignore: ['**/node_modules/**'], cwd }))
  .map(p => join(cwd, p))
  .map(file => {
    const parsed = parsePostFM(file);
    return { file, parsed };
  })
  .each(post => {
    const { file, parsed } = post;
    let { body: contents, attributes: meta } = parsed;
    let save = false;

    // delete duplicate metadata
    if ('photos' in meta) {
      delete meta.photos;
      save = true;
    }
    if (meta.cover && meta.thumbnail) {
      delete meta.cover;
      save = true;
    }
    if (meta.description && meta.subtitle) {
      delete meta.subtitle;
      save = true;
    }
    if (meta.description && meta.excerpt) {
      delete meta.excerpt;
      save = true;
    }

    if (save) {
      const build = `
---
${yaml.stringify(meta).trim()}
---

${contents}
      `;
      writefile(file, build.trim());
    }
  });
