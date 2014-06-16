module.exports = function(err, lint) {
	var repport = {};
	if (err) {
		repport.errors = err.map(function(e) {
			if (typeof e === 'string') {
				return {
					message: e
				};
			} else {
				return {
					message: e.message,
					stack: e.stack
				};
			}
		});
	}
	if (lint.length) {
		repport.lint = lint.map(function(l) {
			delete l.lines;
			return l;
		});
	}
	console.log(JSON.stringify(repport, null, '\t'));
};
