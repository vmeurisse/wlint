var util = require('util');

var jshint = require('jshint').JSHINT;

var DefaultValidator = require('./DefaultValidator');

var Validator = function() {
};

util.inherits(Validator, DefaultValidator);

Validator.prototype.getDefaultPatterns = function() {
	return ['*.js'];
};

Validator.prototype.mergeConfig = function(config, defaults) {
	if (config.globals && defaults.globals) {
		for (var key in defaults.globals) {
			if (!(key in config.globals)) {
				config.globals[key] = defaults.globals[key];
			}
		}
	}
	DefaultValidator.prototype.mergeConfig.apply(this, arguments);
};

Validator.prototype.validate = function(options, cb) {
	var err = [];
	
	options.config.indent = 1;
	
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
