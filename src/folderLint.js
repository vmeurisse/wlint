var fstreamIgnore = require('fstream-ignore');

var fileLint = require('./fileLint');

function Linter(folder, cb) {
	this.nbFiles = 0;
	this.ended = false;
	this.cb = cb;
	
	this.err = [];
	this.lints = [];
	
	fstreamIgnore({
		path: folder,
		ignoreFiles: ['.wlintignore', '.gitignore']
	}).on('child', function(c) {
		if (c.type === 'File') {
			this.nbFiles++;
			fileLint.lint({path: c.path}, this.onValidate.bind(this));
		}
	}.bind(this)).on('end', function() {
		this.ended = true;
		this.end();
	}.bind(this));
};

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

exports.lint = function(folder, cb) {
	new Linter(folder, cb);
};
