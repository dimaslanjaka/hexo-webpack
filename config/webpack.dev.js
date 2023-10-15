const { merge } = require('webpack-merge');
const paths = require('./paths');
const common = require('./webpack.common.js');
const cli = require('./cli');
const excludePatterns = require('./webpack.excludes');
const { modifyConfigJson } = require('./utils');

/**
 * @type {import('webpack').Configuration}
 */
module.exports = merge(common, {
  entry: [paths.src + '/index.tsx'],
  output: {
    filename: 'runtime/main.js'
  },
  module: {
    rules: [
      {
        test: /\.(s[a|c]ss)$/,
        use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
        exclude: excludePatterns.css
      }
    ]
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: [paths.public, paths.tmp + '/static', paths.cwd + '/source'],
    historyApiFallback: true,
    compress: true,
    hot: true,
    // yarn start --port 8888
    port: cli.port || 4000,
    // yarn start --host custom.host.name
    host: cli.host || 'adsense.webmanajemen.com',
    open: false
  }
});

// write to ../config.json
modifyConfigJson({ mode: 'development' });
