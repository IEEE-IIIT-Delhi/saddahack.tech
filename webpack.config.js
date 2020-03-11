'use strict';

// Local modules
const path = require('path');
const { readdirSync, statSync } = require('fs');

// Webpack plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const ImageminWebpWebpackPlugin = require('imagemin-webp-webpack-plugin');
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const SizePlugin = require('size-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

// Get all page roots
const pagesDir = path.join(__dirname, 'pages/');
const pages = readdirSync(pagesDir).filter(f => statSync(path.join(pagesDir, f)).isDirectory());

module.exports = async (env, argv) => {
	// Get all that YAML data
	const data = require('./scripts/get-yaml-data');

	// Site paths for sitemap generator - exclude some pages
	const sitemapExcludes = ['404', 'index'];
	const sitemapPaths = [
		'/',
		...pages.filter(p => !sitemapExcludes.includes(p)).map(p => '/' + p)
	];

	// Webpack entry object
	const entryObj = {};
	pages.map(page => {
		entryObj[page] = `./pages/${page}/${page}`
	});

	// HTML Webpack plugin generator
	const htmlPluginBaseOptions = page => ({
		template: `./pages/${page}/${page}.pug`,
		filename: page + '.html',
		inject: false,
		pretty: true,
		...data
	});

	const htmlPlugins = pages.map(page => new HtmlWebpackPlugin(htmlPluginBaseOptions(page)));

	return {
		devtool: 'sourcemap',
		devServer: {
			contentBase: [
				'./dist',
				'./'
			],
			hot: true,
			writeToDisk: true,
			watchContentBase: true,
			open: 'firefox'
		},
		stats: 'errors-only',
		entry: entryObj,
		output: {
			path: path.join(__dirname, 'dist'),
			filename: 'assets/js/[name].js',
			publicPath: '',
		},
		module: {
			rules: [{
				test: /\.pug/,
				use: [{
					loader: 'pug-loader'
				}]
			}]
		},
		plugins: [
			new SizePlugin(),
			new WriteFilePlugin(),
			new CopyWebpackPlugin([
				{
					from: 'assets',
					to: 'assets'
				}, {
					from: 'static',
					to: ''
				}
			]),
			...htmlPlugins,
			new ImageminPlugin(),
			new ImageminWebpWebpackPlugin({
				config:[
					{
						test: /assets\/img/
					}
				],
				detailedLogs: true
			}),
			new SitemapPlugin('http://ieee.iiitd.edu.in', sitemapPaths)
		],
		resolve: {
			extensions: [
				'.js'
			]
		},
		optimization: {
			concatenateModules: true,
		}
	}
};
