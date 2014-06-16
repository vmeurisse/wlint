var chalk = require('chalk');

var okMsg = [
	"It's time to relax.",
	'Well done.',
	'Good job.',
	'Congratulations.',
	"I'm so proud of you.",
	'Hooray!',
	"You've got a Crockford point.",
	"You've got a Stephen C. Johnson point.",
	'Great! How about some chocolate as recompense?',
	'Commit time!'
];

var failMsg = [
	'Good luck to fix that.',
	'Argh, more work needed!!',
	"I'm a broken robot, please fix my code.",
	'Fix that before anyone notice.',
	'Douglas Crockford will be sad.',
	'Goodbye cruel world.',
	'Ooops.',
	'Dura lex sed lex.',
	'By ignorance we mistake, and by mistakes we learn.',
	'Your mission, should you decide to accept it, is to fix that.' +
		'This tape will self-destruct in five seconds. Good luck, Jim!'
];

function pad(t, length, char) {
	t = '' + t;
	var missing = Math.max(length - t.length, 0);
	return new Array(missing + 1).join(char) + t;
}

function getError(message, code, filename) {
	return chalk.bold(message) + ' [' + code + '] at ' + chalk.green(filename);
}

function getLine(n, line, highlight) {
	var lineNum = pad(n, 6, ' ');
	line = line.replace(/\t/g, ' ');
	return (highlight ? chalk.bold(lineNum) : chalk.grey(lineNum)) + ' |' + line;
}

function getPointer(column) {
	return chalk.grey(pad('^', column + 8, '-'));
}

module.exports = function(err, lints) {
	var nbLints = 0;
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
		var report = [];
		lints.forEach(function(file) {
			var lines = file.lines;
			var path = file.file;
			file.errors.forEach(function(error) {
				nbLints++;
				var line = error.line;
				report.push(getError(error.message, error.code, path));
				for (var i = Math.max(line - 2, 1); i <= line; i++) {
					report.push(getLine(i, lines[i - 1], i === line));
				}
				report.push(getPointer(error.column));
				for (i = line + 1; i < lines.length && i <= line + 2; i++) {
					report.push(getLine(i, lines[i - 1]));
				}
			});
		});
		if (err) console.log('\n' + chalk.bold.yellow('Lint' + (nbLints > 1 ? 's' : '') + ':'));
		console.log(report.join('\n'));
	}
	
	var msg, quoteArray;
	if (err || nbLints) {
		var nb = (err ? err.length : 0) + nbLints;
		msg = 'Found ' + chalk.bold.red(nb + ' error' + (nb > 1 ? 's' : '')) + '.';
		quoteArray = failMsg;
	} else {
		msg = 'Everything is ' + chalk.bold.green('ok') + '.';
		quoteArray = okMsg;
	}
	console.log('\n' + msg + ' ' + quoteArray[Math.floor(Math.random() * quoteArray.length)] + '\n');
};
