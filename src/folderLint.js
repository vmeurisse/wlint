var fileLint = require('./fileLint');
var findFiles = require('./findFiles');

function Linter(folder, options, cb) {
	this.nbFiles = 0;
	this.ended = false;
	this.cb = cb;
	
	this.err = [];
	this.lints = [];
	
	findFiles({
		base: folder,
		ignoreFiles: ['.wlintignore', '.gitignore']
	}, function(err) {
		if (err) this.err = this.err.push(err);
		this.ended = true;
		this.end();
	}.bind(this))
	.on('file', function(file) {
		this.nbFiles++;
		fileLint.lint({path: file}, options, this.onValidate.bind(this));
	}.bind(this));
}

Linter.prototype.onValidate = function(err, lint) {
	if (err) this.err = this.err.concat(err);
	if (lint) this.lints.push(lint);
	this.nbFiles--;
	this.end();
};

Linter.prototype.end = function() {
	if (this.ended && this.nbFiles === 0) {
		this.cb(this.err.length ? this.err : null, this.lints);
	}
};

exports.lint = function(folder, options, cb) {
	new Linter(folder, options, cb);
};
