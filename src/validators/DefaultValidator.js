var Validator = function() {
};

Validator.prototype.mergeConfig = function(config, defaults) {
	for (var key in defaults) {
		if (!(key in config)) {
			config[key] = defaults[key];
		}
	}
};

/**
 * File patterns that this validator will validate if no other configuration is provided.
 * 
 * eg. `['*.js']`
 * @return {string[]} 
 */
Validator.prototype.getDefaultPatterns = function() {
	return [];
};

Validator.prototype.validate = function(options, cb) {
	cb();
};

module.exports = Validator;
