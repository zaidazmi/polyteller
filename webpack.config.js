const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';

  return {
    entry: {
      background: './src/background/background.ts',
      content: ['./src/content/content.ts', './src/styles/content.css'],
      popup: './src/popup/popup.ts',
      allNotifications: './src/popup/allNotifications.ts',
      styles: './src/styles/popup.css',
      allNotificationsStyles: './src/styles/allNotifications.css',
      privacyMode: './src/content/privacyMode.ts',
      privacyModeEarly: './src/content/privacyModeEarly.ts',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.css'],
      alias: {
        'zustand': path.resolve(__dirname, 'node_modules/zustand'),
      },
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' },
          { from: 'src/popup/popup.html', to: 'popup.html' },
          { from: 'src/popup/allNotifications.html', to: 'allNotifications.html' },
          { from: "src/icon.png", to: "icon.png" },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify(mode)
        }
      })
    ],
    mode: mode,
    devtool: mode === 'development' ? 'source-map' : false
  };
};