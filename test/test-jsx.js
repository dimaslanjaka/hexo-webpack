const { writefile } = require('sbg-utility');
const genRoute = require('./genRoute');
const render = require('./render');
const fs = require('fs');

render
  .init()
  .then(async () => {
    try {
      const result = await genRoute(__dirname + '/fixtures/shortcodes.md');
      writefile(__dirname + '/../routes.json', JSON.stringify([result], null, 2));
      writefile(__dirname + '/tmp/body.md', result.body);
      writefile(__dirname + '/tmp/body.jsx', fs.readFileSync(result.jsxPath, 'utf-8'));
    } catch (message) {
      return console.error(message);
    }
  })
  .catch(console.error);
