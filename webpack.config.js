const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    'background': './src/background/index.js',
    'content': './src/content/index.js',
    'popup': './src/popup/index.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'popup.html', to: '.' },
        { from: 'popup.css', to: '.' },
        { from: 'logo.png', to: '.' },
        { from: 'snow_x25.js', to: '.' },
        { from: 'finger-deep-optimized.json', to: 'finger.json' },
        { from: 'finger24-headers.json', to: '.' },
        { from: 'active-fingerprints.json', to: '.' },
        { from: 'WeakPass.yaml', to: '.' },
      ],
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
  },
  resolve: {
    extensions: ['.js'],
  },
  devtool: false,
};
