var folderLint = require('./folderLint');

/**
 * Lint a folder an return the result
 * @param {Object} config
 * @param {string} config.folder - folder containing the files to lint. Can be relative to the current working directory
 *                                 or an absolute path.
 * @param {integer} [config.threads = nb CPUs] - Number of threads to use for validation. Node if more than one thread
 *                                               is used, one will be dedicated to read files while the others will do
 *                                               the actual validation.
 * @param {string} [config.reporter = 'default'] - Reporter to use. 'default' or 'json'.
 * @param {function} cb - The function to call when the lint is finished.
 */
exports.lint = function(config, cb) {
	folderLint.lint(config.folder, config, function(err, lints) {
		require('./fileLint').killWorkers();
		var reporter = config.reporter || 'default';
		require('./reporters/' + reporter)(err, lints);
		cb(err, lints);
	});
};
