const alias = require('./.alias');
const presets = ['@babel/env', '@babel/react', '@babel/preset-typescript'];
const plugins = [
  [
    require.resolve('babel-plugin-module-resolver'),
    {
      root: ['./src/'],
      alias
    }
  ]
];

module.exports.config = { cacheDirectory: './tmp/babel', presets, plugins };

/**
 *
 * @param {*} api
 * @returns
 */
module.exports = function (api) {
  api.cache(true);

  return { presets, plugins };
};
