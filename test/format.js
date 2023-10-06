const prettier = require('prettier');
const config = require('../.prettierrc.json');

delete config.$schema;

function prettierFormat(source, options) {
  return prettier.format(source, { ...config, options });
}

module.exports = prettierFormat;
