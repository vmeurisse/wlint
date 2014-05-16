var validators = require('./validators');

function validate(options, cb) {
	var validated = 0;
	var errors = [];
	var lints = [];
	
	var file = options.file;
	var val = options.validators;
	
	val.forEach(function(validator) {
		validators[validator.validator].validate({
			path: file.path,
			content: file.content,
			config: validator.config
		}, function(e, l) {
			if (e) errors = errors.concat(e);
			lints = lints.concat(l);
			validated++;
			if (validated === val.length) {
				errors = errors.length ? errors : null;
				
				if (lints.length) {
					lints.sort(function(a, b) {
						return (a.line === b.line) ? a.column - b.column : a.line - b.line;
					});
				} else {
					lints = null;
				}
				
				cb({
					errors: errors,
					lints: lints
				});
			}
		});
	});
}

process.on('message', function(e) {
	validate(e, function(result) {
		process.send(result);
	});
});

module.exports = validate;
