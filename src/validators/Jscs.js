var util = require('util');

var Jscs = require('jscs');

var DefaultValidator = require('./DefaultValidator');

var Validator = function() {
};

util.inherits(Validator, DefaultValidator);

Validator.prototype.getDefaultPatterns = function() {
	return ['*.js'];
};

Validator.prototype.validate = function(options, cb) {
	var jscs = new Jscs();
	jscs.registerDefaultRules();
	var conf = {};
	for (var key in options.config) conf[key] = options.config[key];
	jscs.configure(conf);
	try {
		var errors = jscs.checkString(options.content, options.path);
		errors = errors.getErrorList().map(function(error) {
			return {
				line: error.line,
				column: error.column + 1,
				message: error.message,
				code: 'jscs'
			};
		});
		cb(null, errors);
	} catch (e) {
		cb([e], []);
	}
};

module.exports = Validator;
