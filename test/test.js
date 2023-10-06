const { init, render } = require('./render');
const toJsx = require('./toJsx');
const prettier = require('prettier');
const { writefile } = require('sbg-utility');

init()
  .then(async hexo => {
    console.log('hexo initialized', hexo.base_dir);
    try {
      const result = await render(__dirname + '/fixtures/shortcodes.md');
      console.log('render successful');
      delete result.hexo;
      result.body = result.content;
      delete result.content;
      try {
        const html = await prettier.format(result.body, { parser: 'html' });
        console.log('prettier successful');
        writefile(__dirname + '/tmp/body.html', html);
        writefile(__dirname + '/../routes.json', JSON.stringify([result], null, 2));
        try {
          const jsx = await toJsx(html);
          console.log('jsx successful');
          writefile(__dirname + '/tmp/body.jsx', jsx);
        } catch {
          return console.error('jsx fail');
        }
      } catch (_e) {
        return console.log('prettier fail');
      }
    } catch (_e_1) {
      return console.log('render fail');
    }
  })
  .catch(console.error);
