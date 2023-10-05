const { init, render } = require('./render');
const toJsx = require('./toJsx');
const prettier = require('prettier');
const fs = require('fs');

init().then(() => {
  render(__dirname + '/fixtures/shortcodes.md')
    .then(result => {
      delete result.hexo;
      result.body = result.content;
      delete result.content;
      return prettier.format(result.body, { parser: 'html' }).then(html => {
        fs.writeFileSync(__dirname + '/tmp/body.html', html);
        fs.writeFileSync(__dirname + '/../routes.json', JSON.stringify([result], null, 2));
        return toJsx(html).then(jsx => {
          fs.writeFileSync(__dirname + '/tmp/body.jsx', jsx);
        });
      });
    })
    .catch(console.error);
});
