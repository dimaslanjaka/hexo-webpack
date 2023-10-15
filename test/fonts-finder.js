// generate font-faces

const fs = require('fs');
const path = require('path');
const { writefile } = require('sbg-utility');

const scss = fs
  .readdirSync(__dirname)
  .filter(file => path.join(__dirname, file) !== __filename)
  .filter(file => ['.otf', '.ttf', '.woff', '.woff2'].includes(path.extname(file)))
  .map(file => {
    return `
@font-face {
  font-family: '${path.basename(file, path.extname(file))}';
  src: url('./${file.replace(/\s+/gm, '\\ ')}');
}
  `.trim();
  })
  .join('\n');

writefile(path.join(__dirname, 'index.scss'), scss);
