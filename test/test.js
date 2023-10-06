const { init, render } = require('./render');
const toJsx = require('./toJsx');
const prettier = require('prettier');
const { writefile } = require('sbg-utility');

init()
  .then(() => {
    console.log('hexo initialized');
    return render(__dirname + '/fixtures/shortcodes.md')
      .then(result => {
        console.log('render successful');
        delete result.hexo;
        result.body = result.content;
        delete result.content;
        return prettier.format(result.body, { parser: 'html' }).then(html => {
          console.log('format successful');
          writefile(__dirname + '/tmp/body.html', html);
          writefile(__dirname + '/../routes.json', JSON.stringify([result], null, 2));
          return toJsx(html).then(jsx => {
            console.log('jsx generation successful');
            writefile(__dirname + '/tmp/body.jsx', jsx);
          });
        });
      })
      .catch(_e => console.log('fail render'));
  })
  .catch(console.error);
