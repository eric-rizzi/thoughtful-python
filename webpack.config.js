const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Get all HTML files from src/pages
const pagesDir = path.resolve(__dirname, 'src/pages');
const pages = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));

// Create an HTML plugin for each page
const htmlPlugins = pages.map(page => {
  // Extract the base name without extension
  const baseName = page.replace('.html', '');
  
  // Map the HTML filename to corresponding JS entry point
  // This handles both lesson1.html and lesson_1.html patterns
  const jsEntryPoint = baseName.includes('_') ? baseName : baseName.replace(/(\d+)$/, '_$1');
  
  return new HtmlWebpackPlugin({
    template: path.resolve(pagesDir, page),
    filename: page,
    chunks: [jsEntryPoint, 'main'],
    minify: {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
    },
  });
});

// Dynamic entry points based on TS files in src/ts/lessons
const lessonsDir = path.resolve(__dirname, 'src/ts/lessons');
const entryPoints = {
  main: './src/ts/main.ts',
};

if (fs.existsSync(lessonsDir)) {
  fs.readdirSync(lessonsDir)
    .filter(file => file.endsWith('.ts'))
    .forEach(file => {
      // Use the exact filename (without extension) as the entry point name
      const name = file.replace('.ts', '');
      entryPoints[name] = `./src/ts/lessons/${file}`;
    });
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: entryPoints,
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].[contenthash].js',
      clean: true,
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader, // Always use MiniCssExtractPlugin loader
            'css-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: {
        // Provide browser-compatible alternatives for Node.js modules
        "fs": false,
        "path": false,
        "os": false,
        "crypto": false,
        "stream": false,
        "http": false,
        "https": false,
        "zlib": false,
        "util": false,
        "buffer": false,
        "url": false,
        "assert": false,
        // For node-fetch specifically
        "node-fetch": false
      }
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash].css',
      }),
      new CopyPlugin({
        patterns: [
          { 
            from: 'src/python', 
            to: 'python' 
          },
          { 
            from: 'src/data', 
            to: 'data',
            noErrorOnMissing: true
          },
          { 
            from: 'public', 
            to: '.',
            noErrorOnMissing: true
          },
        ],
      }),
      ...htmlPlugins,
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 9000,
      hot: true,
      open: true,
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: -10
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      },
    },
  };
};