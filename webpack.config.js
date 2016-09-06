var path = require('path');

var BUILD_DIR = path.resolve(__dirname, '');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
	entry: APP_DIR + '/ploma.js',
	output: {
		path: BUILD_DIR,
		filename: 'index.js',
		libraryTarget: 'umd'
	},
	module : {
		loaders : [
			{
				test: /\.(js)$/,
				exclude : [
					/node_modules/
				],
				loader : 'babel-loader'
			}
		]
	},
	resolve: {
		extensions: [
			'', '.webpack.js', '.web.js', '.js' //default		
		],
		alias: {
			base: APP_DIR
		}
	}
};

module.exports = config;