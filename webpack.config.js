const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack"); // IMPORTANTE para usar DefinePlugin

module.exports = {
  mode: "development",
  entry: "./src/js/main.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
  },
  module: {
    rules: [
      { test: /\.s?css$/i, use: ["style-loader", "css-loader", "sass-loader"] },
      { test: /\.(png|jpe?g|gif|svg|webp)$/i, type: "asset/resource" },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "./index.html", inject: "body" }),
    new webpack.DefinePlugin({
      "process.env.TMDB_TOKEN": JSON.stringify(process.env.TMDB_TOKEN),
    }),
  ],
  devServer: { port: 8080, open: true, hot: true },
};
