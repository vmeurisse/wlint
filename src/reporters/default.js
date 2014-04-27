var chalk = require('chalk');

function pad(t, length, char) {
	t = '' + t;
	var missing = Math.max(length - t.length, 0);
	return new Array(missing + 1).join(char) + t;
}

function renderError(message, code, filename) {
	console.log(chalk.bold(message) + ' [' + code + '] at ' + chalk.green(filename));
}

function renderLine(n, line) {
	line = line.replace(/\t/g, ' ');
	console.log(chalk.grey(pad(n, 6, ' ')) + ' |' + line);
}

function renderPointer(column) {
	console.log(chalk.grey(pad('^', column + 8, '-')));
}

module.exports = function(err, lints) {
	if (err) {
		console.log(chalk.bold.red('Error' + (err.length > 1 ? 's' : '') + ':'));
		for (var i = 0; i < err.length; i++) {
			var e = err[i];
			console.log(' * ' + chalk.red(typeof e === 'string' ? e : e.message));
			if (e.stack) {
				console.log(e.stack.replace(/.*\n/, '') + '\n');
			}
		}
	}
	
	if (lints.length) {
		if (err) console.log('\n' + chalk.bold.yellow('Lint' + (lints.length > 1 ? 's' : '') + ':'));
		lints.forEach(function(file) {
			var lines = file.lines;
			var path = file.file;
			file.errors.forEach(function(error) {
				var line = error.line;
				renderError(error.message, error.code, path);
				for (var i = Math.max(line - 2, 1); i <= line; i++) {
					renderLine(i, lines[i - 1]);
				}
				renderPointer(error.column);
				for (i = line + 1; i < lines.length && i <= line + 2; i++) {
					renderLine(i, lines[i - 1]);
				}
			});
		});
	}
};
