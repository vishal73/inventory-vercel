const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.js", // Entry point of your project
  output: {
    filename: "main.js", // Output file name
    path: path.resolve(__dirname, "dist"), // Output directory
  },
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  resolve: {
    fallback: {
      util: require.resolve("util/"),
      buffer: require.resolve("buffer/"),
      stream: require.resolve("stream-browserify"),
      crypto: require.resolve("crypto-browserify"),
      assert: require.resolve("assert/"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify/browser"),
      url: require.resolve("url/"),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
  ],
};
