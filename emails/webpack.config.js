// Webpack v4
const path = require("path");
const glob = require("glob");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const JSTransformer = require("jstransformer")(require("jstransformer-scss"));
//const CopyWebpackPlugin = require("copy-webpack-plugin");
const getLogger = require("webpack-log");
const log = getLogger({ name: "file" });
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MinifyHtmlWebpackPlugin = require("minify-html-webpack-plugin");
const HtmlWebpackCssInlinerPlugin = require("html-webpack-css-inliner-plugin");
const fs = require("fs");

const config = require("./config/main");





// Проверка настроек
module.exports = (env, option) => {
  const production = option.mode === "production";
  const entry = production ? { main: path.resolve(__dirname, config.folders.input.base + "/" + config.scripts.entry_name + ".js") } : {};
  const pluginsOptions = [];
  const pluginsAfterOptions = [];
  const minimizer = [];





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

      // Добавление точки входа для dev
      if (!production) {
        entry[entryKey] = path.resolve(__dirname, entryFile);
      }

      // Удаление дубликатов стилей
      else {
        pluginsAfterOptions.push({
          apply: () => {
            const outFile = path.join(__dirname, config.folders.output.base, filename);
            const source = fs.readFileSync(outFile, "utf-8");
            // Удаление дубликатов стилей
            const search = new RegExp("style=('|\")([a-z0-9\-_\\s:;\.,\#\%]*)('|\")", "gmi");
            const saveValue = v => v === "0" ? v + "px" : v;
            const styles = source.match(search)
              .map(f => {
                o = f.replace(search, "$2");
                n = o.split(";");
                n = n.map(sf => sf.split(":")).reduce((o, [k, v]) => ({ ...o, [k.trim()]: saveValue((v + "").trim()) }), {});
                return [o, Object.entries(n).map(([k, v]) => k + ":" + v).join(";") + ";"];
              });
            styles.forEach(([o, n]) => source.replace(o, n));
            // Удаление атрибутов
            if (config.pages.removeAttrs.length) {
              source.replace(new RegExp("(" + config.pages.removeAttrs.join("|") + ")=('|\")([a-z0-9\-_\\s:;\.,\#\%]*)('|\")", "gmi"), "");
            }
            // Замена doctype
            source.replace(
              new RegExp("(<\!doctype html>)", "i"),
              '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
            );
            // Сохранить изменения
            fs.writeFileSync(outFile, source);
          }
        });
      }
    });

    if (production && config.pages.minify) {
      const file = path.join(__dirname, config.folders.output.base);
      // Минифакция
      pluginsAfterOptions.push(new MinifyHtmlWebpackPlugin({
        src: file,
        dest: file,
        afterBuild: true,
        rules: {
          minifyJS: true,
          minifyCSS: true
        }
      }));
    }
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
  return {
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
            // MiniCssExtractPlugin.loader,
            {
              loader: "style-loader",
              options: {
              }
            },
            "css-loader",
            "postcss-loader",
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
                minimize: config.pages.minify
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
      new HtmlWebpackCssInlinerPlugin(),
      ...pluginsAfterOptions
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
      host: "localhost",
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
  };
};