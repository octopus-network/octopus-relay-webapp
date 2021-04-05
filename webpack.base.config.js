/* eslint-disable camelcase */

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { WebpackPluginServe } = require('webpack-plugin-serve');

function mapChunks (name, regs, inc) {
  return regs.reduce((result, test, index) => ({
    ...result,
    [`${name}${index}`]: {
      chunks: 'initial',
      enforce: true,
      name: `${name}.${`0${index + (inc || 0)}`.slice(-2)}`,
      test
    }
  }), {});
}

function resolver (input) {
  return Array.isArray(input)
    ? input
      .filter((plugin) => !!plugin)
      .map((plugin) =>
        Array.isArray(plugin)
          ? [require.resolve(plugin[0]), plugin[1]]
          : require.resolve(plugin)
      )
    : require.resolve(input);
}

function createWebpack (ENV, context) {
  const pkgJson = require(path.join(context, 'package.json'));
  const isProd = ENV === 'production';

  const plugins = [];

  !isProd && plugins.push(
    new WebpackPluginServe({
      hmr: false, // switch off, Chrome WASM memory leak
      liveReload: false, // explict off, overrides hmr
      port: 3000,
      progress: false, // since we have hmr off, disable
      static: path.join(process.cwd(), '/dist')
    })
  );

  return {
    context,
    entry: ['@babel/polyfill', './src/index.tsx'],
    mode: ENV,
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            isProd
              ? MiniCssExtractPlugin.loader
              : 'style-loader',
            {
              loader: 'css-loader'
            }
          ]
        },
        {
          exclude: /node_modules/,
          test: /\.less$/,
          use: [
            isProd
              ? MiniCssExtractPlugin.loader
              : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  localIdentName: '[local]_[hash:base64:8]'
                }
              }
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true,
                }
              }
            }
          ]
        }, 
        {
          exclude: /src/,
          test: /\.less$/,
          use: [
            isProd
              ? MiniCssExtractPlugin.loader
              : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1
              }
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  modifyVars: { 
                    '@primary-color': '#53ab90',
                    '@linnk-color': '#096dd9',
                    '@border-radius-base': '3px',
                    '@border-color-base': '#e8e8e8',
                    '@btn-border-radius-base': '20px',
                    '@input-border-color': '#d8d8d8'
                  },
                  javascriptEnabled: true
                }
              }
            }
          ]
        },
        {
          exclude: /(node_modules)/,
          test: /\.(js|ts|tsx)$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: resolver([
                  ['@babel/preset-env', {
                    modules: 'commonjs',
                    targets: {
                      browsers: '>0.25% and last 2 versions and not ie 11 and not OperaMini all',
                      node: '10'
                    }
                  }],
                  '@babel/preset-typescript',
                  '@babel/preset-react'
                ])
              }
            }
          ]
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/i, 
          loader: 'url-loader?name=app/images/[name].[ext]'
        },
      ],
    },
    node: {
      child_process: 'empty',
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          ...mapChunks('polkadot', [
            /* 00 */ /node_modules\/@polkadot\/(wasm)/,
            /* 01 */ /node_modules\/(@polkadot\/(api|metadata|rpc|types))/,
            /* 02 */ /node_modules\/(@polkadot\/(extension|keyring|react|ui|util|vanitygen)|@acala-network|@edgeware|@laminar|@ledgerhq|@open-web3|@subsocial|@zondax|edgeware)/
          ]),
          ...mapChunks('react', [
            /* 00 */ /node_modules\/(@fortawesome)/,
            /* 01 */ /node_modules\/(@emotion|@ant-design|antd|@semantic-ui-react|@stardust|classnames|chart\.js|codeflask|copy-to-clipboard|file-selector|file-saver|hoist-non-react|i18next|jdenticon|keyboard-key|mini-create-react|popper\.js|prop-types|qrcode-generator|react|remark-parse|semantic-ui|styled-components)/
          ]),
          ...mapChunks('other', [
            /* 00 */ /node_modules\/(@babel|ansi-styles|asn1|browserify|buffer|history|html-parse|inherit|lodash|memoizee|object|path-|parse-asn1|pbkdf2|process|public-encrypt|query-string|readable-stream|regenerator-runtime|repeat|rtcpeerconnection-shim|safe-buffer|stream-browserify|store|tslib|unified|unist-util|util|vfile|vm-browserify|webrtc-adapter|whatwg-fetch)/,
            /* 01 */ /node_modules\/(attr|brorand|camelcase|core|chalk|color|create|cuint|decode-uri|deep-equal|define-properties|detect-browser|es|event|evp|ext|function-bind|has-symbols|ieee754|ip|is|lru|markdown|minimalistic-|moment|next-tick|node-libs-browser|random|regexp|resolve|rxjs|scheduler|sdp|setimmediate|timers-browserify|trough)/,
            /* 03 */ /node_modules\/(base-x|base64-js|blakejs|bip|bn\.js|cipher-base|crypto|des\.js|diffie-hellman|elliptic|hash|hmac|js-sha3|md5|miller-rabin|ripemd160|secp256k1|sha\.js|xxhashjs)/
          ])
        }
      }
    },
    output: {
      chunkFilename: '[name].[chunkhash:8].js',
      filename: '[name].[hash:8].js',
      globalObject: '(typeof self !== \'undefined\' ? self : this)',
      path: path.join(context, 'dist'),
      publicPath: ''
    },
    performance: {
      hints: false
    },
    
    plugins: plugins.concat([
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(ENV),
          CONTRACT_NAME: JSON.stringify(process.env.CONTRACT_NAME),
          VERSION: JSON.stringify(pkgJson.version),
          WS_URL: JSON.stringify(process.env.WS_URL)
        }
      }),
      new webpack.optimize.SplitChunksPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash:8].css'
      })
    ]).filter((plugin) => plugin),
    resolve: {
      alias: {},
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    watch: !isProd,
    watchOptions: {
      ignored: ['.yarn', /dist/, /node_modules/]
    }
  };
}

module.exports = createWebpack;