const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

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

    // Inyecta credenciales al bundle
    new webpack.DefinePlugin({
      "process.env.TMDB_TOKEN": JSON.stringify(process.env.TMDB_TOKEN || ""),
      "process.env.TMDB_API_KEY": JSON.stringify(
        process.env.TMDB_API_KEY || ""
      ),
    }),

    // Copia assets a dist/asset para usarlos directo en el HTML
    new CopyWebpackPlugin({
      patterns: [{ from: "src/asset", to: "asset" }],
    }),
  ],
  devServer: {
    port: 8080,
    open: true,
    hot: true,
    static: { directory: path.join(__dirname, "public") }, // opcional
  },
};
