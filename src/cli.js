var commander = require('commander');

module.exports = function() {
	commander.version(require('../package.json').version)
	         .usage('[options] [folder] — Lint files found in the given folder. Defaults to the current folder')
	         .parse(process.argv);
	
	require('./wlint').lint({folder: commander.args[0] || '.'}, function(err, lint) {
		var status = err ? 1 : lint.length ? 2 : 0;
		require('exit')(status);
	});
};
