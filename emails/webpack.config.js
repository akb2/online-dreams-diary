// Webpack v4
const path = require("path");
const glob = require("glob");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const JSTransformer = require('jstransformer')(require('jstransformer-scss'));
//const CopyWebpackPlugin = require("copy-webpack-plugin");
const getLogger = require("webpack-log");
const log = getLogger({ name: "file" });
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MinifyHtmlWebpackPlugin = require('minify-html-webpack-plugin');
const fs = require('fs');

const config = require("./config/main");





// Проверка настроек
module.exports = (env, option) => {
  const production = option.mode === "production";
  const entry = production ? { main: path.resolve(__dirname, config.folders.input.base + "/" + config.scripts.entry_name + ".js") } : {};
  let pluginsOptions = [];
  let minimizer = [];





  // Очистка папки вывода
  if (config.base.clean === true) {
    pluginsOptions.push(
      new CleanWebpackPlugin()
    );
  }


  // Поиск страниц PUG
  {
    const pages = glob.sync(__dirname + "/" + config.folders.input.pages + "\\**\\*.pug");

    pages.forEach(function (file) {
      let base = path.relative(__dirname + "/" + config.folders.input.pages, file);
      base = base.replace(/\.pug$/, "");
      const filename = config.folders.output.pages + "/" + base + "." + (production ? config.pages.ext : "html");
      const template = config.folders.input.pages + "/" + base + ".pug";
      const entryFile = config.folders.input.pages + "/" + base + ".js";
      const entryKey = base.replace(/([\/]+)/i, "-");

      pluginsOptions.push(
        new HtmlWebpackPlugin({
          filename,
          template,
          inject: !production,
          minify: config.pages.minify,
        })
      );

      if (!production) {
        entry[entryKey] = path.resolve(__dirname, entryFile);
      }

      if (production && config.pages.minify) {
        const file = path.join(__dirname, config.folders.output.base);
        pluginsOptions.push(new MinifyHtmlWebpackPlugin({
          src: file,
          dest: file,
          afterBuild: true,
          rules: {
            minifyJS: true,
            minifyCSS: true
          }
        }));
      }
    });
  }


  // Минификация
  {

    // Java Script
    if (production === true & config.scripts.minify === true) {
      minimizer.push(new UglifyJsPlugin({
        test: /\.js(\?.*)?$/i,
        extractComments: true
      }));
    }

    // CSS
    {
      if (production === true) {
        minimizer.push(new OptimizeCssAssetsPlugin({
          assetNameRegExp: /\.css$/g,
          cssProcessor: require("cssnano"),
          cssProcessorPluginOptions: {
            preset: [
              "default", {
                discardComments: { removeAll: true }
              }
            ]
          },
          canPrint: true
        }));
      }
    }
  }





  // Базовые настройки WebPack
  let webpack_config = {
    entry,
    output: {
      path: path.resolve(__dirname, "./" + config.folders.output.base),
      filename: config.folders.output.scripts + "/[name].js",
      publicPath: production ? "/" : "http://localhost:" + config.server.port + "/",
    },
    module: {
      rules: [
        // Стили
        {
          test: /\.(css|scss|sass)$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            "sass-loader",
          ]
        },
        // Шаблоны PUG
        {
          test: /\.pug$/,
          loaders: [
            {
              loader: "html-loader",
              options: {
                minimize: false
              }
            }, {
              loader: "pug-html-loader",
              options: {
                pretty: true,
                data: {
                  require,
                  scss: JSTransformer,
                  production,
                  renderScss: file => production ? JSTransformer.renderFile(file).body : ""
                }
              }
            }
          ]
        },
        // Картинки
        {
          test: /\.(gif|png|jpg|jpeg|svg)?$/,
          include: path.join(__dirname, config.folders.input.images),
          loader: "file-loader",
          options: {
            name: "[folder]/[name].[ext]",
            outputPath: (production ? "" : "/") + config.folders.output.images,
            esModule: false
          }
        },
        // Шрифты
        {
          test: /\.(otf|eot|woff|woff2|ttf|ttc|svg)?$/,
          include: path.join(__dirname, config.folders.input.fonts),
          loader: "file-loader",
          options: {
            name: "[folder]/[name].[ext]",
            outputPath: (production ? "" : "/") + config.folders.output.fonts,
            esModule: false
          }
        }
      ]
    },
    plugins: [
      new webpack.ProgressPlugin(),
      new MiniCssExtractPlugin({
        filename: config.folders.output.styles + "/" + config.styles.export_name + ".css"
      }),
      ...pluginsOptions,
    ],
    optimization: {
      minimizer: [
        ...minimizer
      ],
    },
    devServer: {
      index: "index.html",
      openPage: config.server.openPage,
      publicPath: "/",
      contentBase: path.resolve(__dirname, config.folders.output.base),
      writeToDisk: true,
      liveReload: true,
      compress: true,
      inline: true,
      open: true,
      port: config.server.port,
      watchOptions: {
        poll: true,
        ignored: [
          "/node_modules/",
          "/.git/",
          "/.vscode/",
          "/config/",
          path.resolve(__dirname, config.folders.output.base)
        ]
      }
    }
  }





  return webpack_config;
};