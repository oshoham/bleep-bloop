var webpack = require('webpack');

var baseDir = __dirname + '/static/js';

module.exports = {
  context: baseDir,

  entry: './src/index',

  output: {
    path: baseDir + '/dist',
    filename: 'bundle.js'
  },

  plugins: [],

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'es2015']
        }
      }
    ]
  },

  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx']
  }
};
