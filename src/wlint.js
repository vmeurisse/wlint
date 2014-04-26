var folderLint = require('./folderLint');

exports.lint = function(config, cb) {
	folderLint.lint(config.folder, function(err, lints) {
		if (err) console.log('--ERROR--\n', JSON.stringify(err, null, '\t'));
		if (lints.length) console.log('--LINTS--\n', JSON.stringify(lints, null, '\t'));
		if (!err && !lints.length) console.log('Hurray!!! Everything is fine');
		cb(err, lints);
	});
};
