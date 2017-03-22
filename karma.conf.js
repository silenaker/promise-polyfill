module.exports = function (config) {
	config.set({
		frameworks: ['mocha'],
		files: [
			'Promise.js',
			'Promise.spec.js'
		],
		preprocessors: {
			'Promise.spec.js': ['webpack']
		},
		webpack: require('./webpack.test.js'),
		reporters: ['progress'],
		browsers: ['Chrome'],
		singleRun: true
	})
}