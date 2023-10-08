const fixHtml = require('./fixHtml');
const { init, render } = require('./render');
const { writefile } = require('sbg-utility');
const { tmp } = require('./utils');

init()
  .then(async hexo => {
    console.log('hexo initialized', hexo.base_dir);
    try {
      const source = __dirname + '/fixtures/jsx-conflict.md';
      const result = await render(source);
      console.log('render successful');
      delete result.hexo;
      result.body = result.content;
      delete result.content;
      try {
        const html = await fixHtml(result.body);
        console.log('prettier successful');
        writefile(tmp('test/body.html'), html);
        writefile(__dirname + '/../routes.json', JSON.stringify([result], null, 2));
        // try {
        //   const jsx = await toJsx({ source, body: html });
        //   console.log('jsx successful');
        //   writefile(__dirname + '/tmp/body.jsx', jsx);
        // } catch (je) {
        //   return console.error('jsx fail', je);
        // }
      } catch (pe) {
        return console.log('prettier fail', pe);
      }
    } catch (re) {
      return console.log('render fail', re);
    }
  })
  .catch(console.error);
