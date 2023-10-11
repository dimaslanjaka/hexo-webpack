const paths = require('./config/paths');
const presets = ['@babel/env', '@babel/react', '@babel/preset-typescript'];
const plugins = [
  [
    require.resolve('babel-plugin-module-resolver'),
    {
      root: [__dirname, './src'],
      extensions: ['.jsx', '.js', '.ts', '.tsx', '.json'],
      alias: paths.aliasRelative
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
