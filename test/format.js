const prettier = require('prettier');
const config = require('../.prettierrc.json');

delete config.$schema;

/**
 * format using prettier and project config
 * @param {string} source
 * @param {prettier.Config} options
 * @returns
 */
function prettierFormat(source, options) {
  options = { ...config, ...options };
  return prettier.format(source, options);
}

module.exports = prettierFormat;

if (require.main === module) {
  require('./test-jsx');
}
