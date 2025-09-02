const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/renderer/App.tsx',
  output: {
    path: path.resolve(__dirname, 'src/renderer'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
    devServer: {
      static: {
        directory: require('path').join(__dirname, 'src/renderer'),
      },
      hot: true,
      port: 3000,
      open: false,
    },
};
