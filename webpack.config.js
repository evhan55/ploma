var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'bin');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
	entry: APP_DIR + '/ploma.js',
	output: {
		path: BUILD_DIR,
		filename: 'ploma.js',
		libraryTarget: 'var',
		library: 'Ploma'
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