var Validator = function() {
};

Validator.prototype.mergeConfig = function(config, defaults) {
	for (var key in defaults) {
		if (!(key in config)) {
			config[key] = defaults[key];
		}
	}
};

Validator.prototype.validate = function(options, cb) {
	cb();
};

module.exports = Validator;
