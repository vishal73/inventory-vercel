const path = require('path');

module.exports = {
  entry: './src/index.js', // Entry point of your project
  output: {
    filename: 'main.js', // Output file name
    path: path.resolve(__dirname, 'dist'), // Output directory
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};
