var fs = require('fs');
var path = require('path');

var minimatch = require('minimatch');

var config = require('./config');
var validators = require('./validators');

var fileTypes = {
	'jscs': '*.js'
};

function Linter(options, cb) {
	this.options = options;
	this.cb = cb;
	
	this.validating = 0;
	this.ended = false;
	
	this.err = [];
	this.lints = [];
	
	for (key in options.lintConfig) {
		if (validators[key] && minimatch(options.path, fileTypes[key], { matchBase: true })) {
			this.validating++;
			validators[key].validate({
				path: options.path,
				content: options.content,
				config: options.lintConfig[key]
			}, this.onValidate.bind(this));
		}
	}
	this.ended = true;
	this.end();
};

Linter.prototype.onValidate = function(err, lints) {
	if (err) this.err = this.err.concat(err);
	this.lints = this.lints.concat(lints);
	
	this.validating--;
	this.end();
};

Linter.prototype.end = function() {
	if (this.ended && this.validating === 0) {
		var err = this.err.length ? this.err : null;
		var lint = this.lints.length ? { file: this.options.path, errors: this.lints } : null;
		this.cb(err, lint);
	}
};

/**
 * Lint a file
 * @param {Object} options
 * @param {string} options.path - path of the file to lint
 * @param {string} [options.content] - Content of the file to lint. If no content is provided `options.path` is used to
 *                                     read the content
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
	if (typeof options.content !== 'string') {
		fs.readFile(options.path, {encoding: 'UTF-8'}, function(err, content) {
			if (err) return cb([err], []);
			options.content = content;
			lint(options, cb);
		});
		return;
	}
	new Linter(options, cb);
};
