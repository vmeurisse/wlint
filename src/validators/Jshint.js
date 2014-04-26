var util = require('util');

var jshint = require('jshint').JSHINT;

var DefaultValidator = require('./DefaultValidator');

var Validator = function() {
};

util.inherits(Validator, DefaultValidator);

Validator.prototype.validate = function(options, cb) {
	var err = [];
	
	jshint(options.content, options.config, options.config.globals);
	var errors = jshint.data().errors;
	if (errors) {
		errors.forEach(function(error) {
			err.push({
				message: error.reason,
				line: error.line,
				column: error.character,
				code: 'jshint:' + error.code
			});
		});
	}
	cb(null, err);
};

module.exports = Validator;
