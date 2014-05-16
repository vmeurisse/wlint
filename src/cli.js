function getOptions(commander) {
	var options = {};
	if (commander.threads) {
		// Use Math.abs as commander will return -1 if command line is `wlint -t1`
		options.threads = Math.abs(+commander.threads);
		if (!options.threads || options.threads % 1 !== 0) {
			throw new Error('Invalid value for `--threads` options. Must be a strictly positive integer');
		}
	}
	
	options.folder = commander.args[0] || '.';
	
	return options;
}

module.exports = function() {
	var commander = require('commander');
	commander.version(require('../package.json').version)
	         .usage('[options] [folder] — Lint files found in the given folder. Defaults to the current folder')
	         .option('-t, --threads <n>', 'Number of threads to use for validation. Default is the number of core of ' +
	                                      'the machine. NOTE: one thread will be dedicated to search and read the ' +
	                                      'files while the others perform the actual validation')
	         .parse(process.argv);
	
	var options = getOptions(commander);
	
	commander = null;
	
	require('./wlint').lint(options, function(err, lint) {
		var status = err ? 1 : lint.length ? 2 : 0;
		require('exit')(status);
	});
};
