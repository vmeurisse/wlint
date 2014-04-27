var folderLint = require('./folderLint');

exports.lint = function(config, cb) {
	folderLint.lint(config.folder, function(err, lints) {
		require('./reporters/default')(err, lints);
		cb(err, lints);
	});
};
