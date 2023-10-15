const path = require('upath');
const cpaths = require('../../config/paths');
const fromRoot = (...paths) => path.join(cpaths.cwd, ...paths);
const tmp = (...paths) => path.join(__dirname, '/../tmp', ...paths);
const fixtures = (...paths) => path.join(__dirname, '/../fixtures', ...paths);

module.exports = { tmp, fixtures, fromRoot };
module.exports.tmp = tmp;
module.exports.fixtures = fixtures;
