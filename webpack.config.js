const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// GitHub Pages repository name
const REPO_NAME = 'thoughtful-python';

// Get all HTML files from src/pages
const pagesDir = path.resolve(__dirname, 'src/pages');
const pages = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  // Use repository name for production (GitHub Pages), empty for development
  const publicPath = isProduction ? `/${REPO_NAME}/` : '/';
  
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
      publicPath: publicPath,
    });
  });

  // Dynamic entry points based on TS files in src/ts/lessons and src/ts/pages
  const lessonsDir = path.resolve(__dirname, 'src/ts/lessons');
  const pagesJsDir = path.resolve(__dirname, 'src/ts/pages');
  const entryPoints = {
    main: './src/ts/main.ts',
  };

  // Add lesson entry points
  if (fs.existsSync(lessonsDir)) {
    fs.readdirSync(lessonsDir)
      .filter(file => file.endsWith('.ts'))
      .forEach(file => {
        // Use the exact filename (without extension) as the entry point name
        const name = file.replace('.ts', '');
        entryPoints[name] = `./src/ts/lessons/${file}`;
      });
  }

  // Add page entry points
  if (fs.existsSync(pagesJsDir)) {
    fs.readdirSync(pagesJsDir)
      .filter(file => file.endsWith('.ts'))
      .forEach(file => {
        const name = file.replace('.ts', '');
        entryPoints[name] = `./src/ts/pages/${file}`;
      });
  }

  return {
    entry: entryPoints,
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].[contenthash].js',
      publicPath: publicPath,
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
            MiniCssExtractPlugin.loader,
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
            to: 'python',
            noErrorOnMissing: true 
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
          {
            from: 'src/images',
            to: 'images',
            noErrorOnMissing: true
          }
        ],
      }),
      ...htmlPlugins,
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: isProduction, // Only compress in production
      port: 9000,
      hot: true,
      open: true,
      historyApiFallback: true, // This will redirect 404s to /index.html
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