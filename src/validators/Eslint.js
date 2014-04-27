var util = require('util');

var eslint = require('eslint').linter;

var DefaultValidator = require('./DefaultValidator');

var Validator = function() {
};

util.inherits(Validator, DefaultValidator);

Validator.prototype.validate = function(options, cb) {
	var errors = eslint.verify(options.content, options.config, options.path);
	if (errors) {
		errors = errors.map(function(error) {
			return {
				line: error.line,
				column: error.column,
				message: error.message,
				code: 'eslint' + (error.ruleId ? ':' + error.ruleId : '') //ESLint does not provide ruleId on syntax error
			};
		});
	}
	cb(null, errors);
};

module.exports = Validator;
