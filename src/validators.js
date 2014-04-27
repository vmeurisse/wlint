var validators = {
	eslint: new (require('./validators/Eslint'))(),
	jscs: new (require('./validators/Jscs'))(),
	jshint: new (require('./validators/Jshint'))()
};

module.exports = validators;
