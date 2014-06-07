var childProcess = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');

var wildmatch = require('wildmatch');

var config = require('./config');
var validators = require('./validators');
var fileLintValidator = require.resolve('./fileLint.validator');

var freeWorkers = [];
var nbworkers = 0;
var maxWorkers = os.cpus().length - 1;
var queue = [];

function defaultValidate(validator, path) {
	var patterns = validator.getDefaultPatterns();
	for (var i = 0; i < patterns.length; i++) {
		if (wildmatch(path, patterns[i], { matchBase: true })) {
			return true;
		}
	}
	return false;
}

function Linter(file, options, cb) {
	this.file = file;
	this.cb = cb;
	
	this.maxWorkers = options.threads ? options.threads - 1 : maxWorkers;
	
	this.validators = [];
	for (var key in file.lintConfig) {
		if (validators[key] && defaultValidate(validators[key], file.path)) {
			this.validators.push({
				validator: key,
				config: file.lintConfig[key]
			});
		}
	}
	
	if (!this.validators.length) return cb();
	
	fs.readFile(file.path, {encoding: 'UTF-8'}, function(err, content) {
		if (err) return cb([err]);
		this.file.content = content;
		this.file.lines = content.split(/\r?\n/);
		this.lint();
	}.bind(this));
}

Linter.prototype.lint = function() {
	if (this.maxWorkers === 0) {
		require(fileLintValidator)({
			validators: this.validators,
			file: this.file
		}, this.onValidate.bind(this));
	} else {
		var worker;
		if (freeWorkers.length) {
			worker = freeWorkers.pop();
		} else if (nbworkers < this.maxWorkers) {
			nbworkers++;
			worker = childProcess.fork(fileLintValidator);
		}
		if (worker) {
			worker.once('message', function(e) {
				freeWorkers.push(worker);
				this.onValidate(e);
				if (queue.length) {
					queue.pop().lint();
				}
			}.bind(this));
			
			worker.send({
				validators: this.validators,
				file: this.file
			});
		} else {
			queue.push(this);
		}
	}
};

Linter.prototype.onValidate = function(result) {
	var lints = result.lints ? { file: this.file.path, lines: this.file.lines, errors: result.lints } : null;
	this.cb(result.err, lints);
};

/**
 * Lint a file
 * @param {Object} file
 * @param {string} file.path - path of the file to lint
 * @param {Object} [file.lintConfig] - Config for the lint. If not provided, it is read in parents folders of
 *                                        `file.path`
 * @param {Object} options
 * @param {integer} [options.thread=nb CPUs] - number of total threads to use.
 * @param {Function} cb
 */
exports.lint = function lint(file, options, cb) {
	if (!file.lintConfig) {
		var folder = path.dirname(file.path);
		config.load(folder, function(err, conf) {
			if (err) return cb([err], []);
			file.lintConfig = conf;
			lint(file, options, cb);
		});
		return;
	}
	new Linter(file, options, cb);
};
