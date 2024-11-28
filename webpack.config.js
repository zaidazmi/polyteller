const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const banner = `
/*!
 * Polyteller 
 * Version: ${process.env.npm_package_version}
 * Copyright (C) ${new Date().getFullYear()} Zaid Azmi
 * All rights reserved
 *  
 * This source code is licensed under a proprietary license.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * 
 * Author: Zaid Azmi
 * Website: https://polyteller.com
 * Email : hi@polyteller.com
 * Version: ${process.env.npm_package_version}
 */`;

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  const isProd = mode === 'production';

  // Chrome API and Extension specific names that must be preserved
  const CHROME_API_NAMES = [
    // Core Chrome API
    'chrome',
    'browser',
    'runtime',
    'tabs',
    'storage',
    'local',
    'sync',
    'alarms',
    'notifications',
    'webNavigation',
    'windows',
    
    // Chrome API Methods
    'sendMessage',
    'onMessage',
    'addListener',
    'removeListener',
    'create',
    'query',
    'get',
    'set',
    'remove',
    'clear',
    'getURL',
    
    // Chrome Event Names
    'onInstalled',
    'onStartup',
    'onAlarm',
    'onUpdated',
    'onActivated',
    
    // Extension Message Types
    'EVENT_INFO',
    'GET_EVENT_INFO',
    'CLEAR_CURRENT_EVENT',
    'NOTIFICATIONS_UPDATED',
    'SCHEDULE_NOTIFICATION',
    'REMOVE_NOTIFICATION_ALARM'
  ];

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
          { from: 'src/icon16.png', to: 'icon16.png' },
          { from: 'src/icon32.png', to: 'icon32.png' },
          { from: 'src/icon48.png', to: 'icon48.png' },
          { from: 'src/icon128.png', to: 'icon128.png' },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify(mode)
        }
      }),
      new webpack.BannerPlugin({
        banner: banner,
        raw: true,
        include: /\.(js|css)$/
      })
    ],
    mode: mode,
    devtool: isProd ? false : 'source-map',
    optimization: {
      minimize: isProd,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            format: {
              comments: isProd ? /^!|@preserve|@license|@cc_on/i : true,
              beautify: false,
              ascii_only: true,
              max_line_len: 500
            },
            compress: {
              drop_console: isProd,
              drop_debugger: isProd,
              pure_funcs: isProd ? [
                'console.log',
                'console.debug',
                'console.info',
                'log',
                'console.warn'
              ] : [],
              passes: 3,
              unsafe_math: true,
              unsafe_methods: true,
              unsafe_proto: true,
              dead_code: true,
              unused: true,
              sequences: true,
              conditionals: true,
              booleans: true,
              if_return: true,
              join_vars: true,
              collapse_vars: true
            },
            mangle: {
              toplevel: true,
              eval: true,
              keep_classnames: false,
              keep_fnames: false,
              safari10: true,
              reserved: [
                ...CHROME_API_NAMES,
                'initializeCountdown',
                'handleUrlChange',
                'updateUI',
                'displayCountdown',
                'PolymarketEvent',
                'NotificationSetting',
                'Notification'
              ],
              properties: {
                regex: /^_/,
                keep_quoted: true,
                reserved: [
                  'endTime',
                  'title',
                  'timezone',
                  'eventId',
                  'minutesBefore',
                  'triggered',
                  'scheduledTime'
                ]
              }
            },
            ecma: 2020,
            module: true,
            toplevel: true
          },
          extractComments: false
        }),
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: {
                  remove: (comment) => !comment.startsWith('!')
                }
              }
            ]
          }
        })
      ]
    }
  };
};