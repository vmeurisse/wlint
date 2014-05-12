var fs = require('fs');
var path = require('path');

var wildmatch = require('wildmatch');

var config = require('./config');
var validators = require('./validators');

var fileTypes = {
	'eslint': '*.js',
	'jscs': '*.js',
	'jshint': '*.js'
};

function Linter(options, cb) {
	this.options = options;
	this.cb = cb;
	
	this.validators = [];
	this.validated = 0;
	
	this.err = [];
	this.lints = [];
	
	for (var key in options.lintConfig) {
		if (validators[key] && wildmatch(options.path, fileTypes[key], { matchBase: true })) {
			this.validators.push({
				validator: validators[key],
				config: options.lintConfig[key]
			});
		}
	}
	
	if (!this.validators.length) return cb();

	fs.readFile(options.path, {encoding: 'UTF-8'}, function(err, content) {
		if (err) return cb([err]);
		this.options.content = content;
		this.options.lines = content.split(/\r?\n/);
		this.lint();
	}.bind(this));
}

Linter.prototype.lint = function() {
	this.validators.forEach(function(validator) {
		validator.validator.validate({
			path: this.options.path,
			content: this.options.content,
			config: validator.config
		}, this.onValidate.bind(this));
	}.bind(this));
};

Linter.prototype.onValidate = function(err, lints) {
	if (err) this.err = this.err.concat(err);
	this.lints = this.lints.concat(lints);
	
	this.validated++;
	this.end();
};

Linter.prototype.end = function() {
	if (this.validated === this.validators.length) {
		var err = this.err.length ? this.err : null;
		var lint = this.lints.length ? { file: this.options.path, lines: this.options.lines, errors: this.lints } : null;
		this.cb(err, lint);
	}
};

/**
 * Lint a file
 * @param {Object} options
 * @param {string} options.path - path of the file to lint
 * @param {Object} [options.lintConfig] - Config for the lint. If not provided, it is read in parents folders of
 *                                        `options.path`
 * @param {Function} cb
 */
exports.lint = function lint(options, cb) {
	if (!options.lintConfig) {
		var folder = path.dirname(options.path);
		config.load(folder, function(err, conf) {
			if (err) return cb([err], []);
			options.lintConfig = conf;
			lint(options, cb);
		});
		return;
	}
	new Linter(options, cb);
};
