const { path, fs, writefile } = require('sbg-utility');

/**
 *
 * @param {Record<string,any>} obj
 */
function modifyConfigJson(obj) {
  const file = path.join(__dirname, '../_config.json');
  /** @type {import('../_config.json') & { mode: string; }} */
  let json = {};
  if (fs.existsSync(file)) {
    json = JSON.parse(fs.readFileSync(file, 'utf-8'));
  }
  writefile(file, JSON.stringify(Object.assign(json, obj)));
}

module.exports = { modifyConfigJson };
