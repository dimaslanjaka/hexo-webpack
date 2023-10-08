const path = require('upath');

const tmp = (...paths) => path.join(__dirname, '/../tmp', ...paths);
const fixtures = (...paths) => path.join(__dirname, '/../fixtures', ...paths);

module.exports = { tmp, fixtures };
module.exports.tmp = tmp;
module.exports.fixtures = fixtures;
