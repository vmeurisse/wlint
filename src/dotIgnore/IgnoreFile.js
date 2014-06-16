var fs = require('fs');
var nodePath = require('path');

var IgnoreRule = require('./IgnoreRule');

function IgnoreFile(path, readyCb) {
	//this.err;
	
	this.pathLength = nodePath.dirname(path).length;
	
	this.onReadyCb = readyCb;
	
	fs.readFile(path, {encoding: 'UTF-8'}, function(err, content) {
		this.parse(content);
	}.bind(this));
}

IgnoreFile.prototype.parse = function(content) {
	content = content.split(/\r?\n/);
	this.rules = [];
	for (var i = 0; i < content.length; i++) {
		var line = content[i];
		if (line === '' || line[0] === '#') continue; //empty lines and comments
		this.rules.push(new IgnoreRule(line));
	}
	this.onReadyCb();
	delete this.onReadyCb;
};

IgnoreFile.prototype.match = function(path, isDir) {
	path = path.slice(this.pathLength + 1);
	
	var matchStatus;
	for (var i = 0; i < this.rules.length; i++) {
		var rule = this.rules[i];
		if (matchStatus === !rule.negated) continue;
		if (rule.onlyDir && !isDir) continue;
		if (this.rules[i].match(path)) matchStatus = !rule.negated;
	}
	return matchStatus;
};

module.exports = IgnoreFile;
