const { path } = require('sbg-utility');

module.exports = {
  '@utils': './src/utils',
  '@components': './src/components',
  '@routes': './src/routes',
  '@assets': './src/assets',
  '@project': './src/project',
  'src': './src',
  '@root': './',
  '@post': './src/posts',
  'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
  'react/jsx-runtime': require.resolve('react/jsx-runtime'),
  '@post': path.resolve(__dirname, '../src/posts')
}