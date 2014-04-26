var validators = {
	jscs: new (require('./validators/Jscs'))(),
	jshint: new (require('./validators/Jshint'))()
};

module.exports = validators;
