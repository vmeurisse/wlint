var util = require('util');

var Jscs = require('jscs');

var DefaultValidator = require('./DefaultValidator');

var Validator = function() {
};

util.inherits(Validator, DefaultValidator);

Validator.prototype.validate = function(options, cb) {
	var jscs = new Jscs();
	jscs.registerDefaultRules();
	var conf = {};
	for (var key in options.config) conf[key] = options.config[key];
	jscs.configure(conf);
	try {
		var errors = jscs.checkString(options.content, options.path);
		errors = errors.getErrorList();
		cb(null, errors);
	} catch (e) {
		cb([e], []);
	}
};

module.exports = Validator;
