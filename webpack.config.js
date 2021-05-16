var debug = process.env.NODE_ENV !== "production";
var webpack = require("webpack");
var path = require("path");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

module.exports = {
  entry: "./src/index.js",
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        query: {
          presets: ["react", "es2015", "stage-0"],
          plugins: ["react-html-attrs", "transform-class-properties", "transform-decorators-legacy"],
        }
      }
    ]
  },
  output: {
    path: __dirname + "/dist/",
    filename: "bundle.js"
  },
  plugins: debug ? [] : [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
  ],
  devServer: {
    host: "0.0.0.0",
    port: 8086,
    disableHostCheck: true,
    outputPath: path.join(__dirname, 'dist'),
    proxy: {
      // the following are placeholders for a backend that follow these path conventions
      "/api/*": {
        target: "http://localhost:5001"
      },
      "/websocket": {
        target: "http://localhost:5001"
      },
      // "/socket.io/*": {
      //   target: "http://localhost:5001"
      // }
    },
  },
};
