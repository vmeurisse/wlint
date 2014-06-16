var fs = require('fs');
var nodePath = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var wildmatch = require('wildmatch');

function flip(array) {
	var map = {};
	for (var i = 0; i < array.length; i++) map[array[i]] = i;
	return map;
}

function IgnoreRule(line) {
	if (line[0] === '!') {
		this.negated = true;
		line = line.slice(1);
	}
	
	if (line[line.length - 1] === '/') {
		this.onlyDir = true;
		line = line.slice(0, -1);
	}
	if (line.indexOf('/') === -1) {
		this.matchBase = true;
	}
	if (line[0] === '/') line = line.slice(1);
	
	this.line = line;
}
IgnoreRule.prototype.negated = false;
IgnoreRule.prototype.onlyDir = false;
IgnoreRule.prototype.match = function(path) {
	return wildmatch(path, this.line, { pathname: !this.matchBase, matchBase: this.matchBase });
};

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

function FindFiles(options, cb) {
	this.files = [];
	this.base = nodePath.resolve(options.base || '.');
	if (options.ignoreFiles) {
		this.ignoreFiles = typeof options.ignoreFiles === 'string' ? [options.ignoreFiles] : options.ignoreFiles;
		this.ignoreFilesMap = flip(this.ignoreFiles);
	} else {
		this.ignoreFiles = [];
		this.ignoreFilesMap = {};
	}
	this.cb = cb;
	
	this.processing = 1;
	this.processDir([], this.base);
}

util.inherits(FindFiles, EventEmitter);

FindFiles.prototype.processDir = function(ignoreFiles, path) {
	fs.readdir(path, function(err, files) {
		if (err || this.err) {
			this.checkFinished(err);
		} else {
			var bestIgnoreLevel = Infinity;
			var bestIgnoreIndex;
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				if (file in this.ignoreFilesMap && this.ignoreFilesMap[file] < bestIgnoreLevel) {
					bestIgnoreLevel = this.ignoreFilesMap[file];
					bestIgnoreIndex = i;
				}
				files[i] = path + nodePath.sep + file;
			}
			this.processing += files.length;
			if (bestIgnoreIndex !== undefined) {
				this.processIgnoreAndFiles(ignoreFiles, files[bestIgnoreIndex], files);
			} else {
				this.processFiles(ignoreFiles, files);
			}
			
			this.processing--;
			this.checkFinished();
		}
	}.bind(this));
};

FindFiles.prototype.processIgnoreAndFiles = function(ignoreFiles, ignoreFile, files) {
	var ignore = new IgnoreFile(ignoreFile, function() {
		ignoreFiles = ignoreFiles.concat([ignore]);
		this.processFiles(ignoreFiles, files);
	}.bind(this));
};

FindFiles.prototype.processFiles = function(ignoreFiles, files) {
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		fs.stat(file, this.afterStat.bind(this, ignoreFiles, file));
	}
};

FindFiles.prototype.afterStat = function(ignoreFiles, file, err, stat) {
	if (err || this.err) {
		this.checkFinished(err);
	} else {
		var dir = stat.isDirectory();
		
		var j = ignoreFiles.length;
		var match;
		while (j-- && match === undefined) {
			match = ignoreFiles[j].match(file, dir);
		}
		if (match === true) {
			this.processing--;
		} else if (dir) {
			this.processDir(ignoreFiles, file);
		} else {
			this.emit('file', file, stat);
			this.files.push(file);
			this.processing--;
		}
		this.checkFinished();
	}
};

FindFiles.prototype.checkFinished = function(err) {
	if (this.finished) return;
	if (err) {
		this.finished = true;
		this.cb(err);
	} else if (this.processing === 0) {
		this.finished = true;
		this.cb(null, this.files);
	}
};

module.exports = function findFiles(options, cb) {
	return new FindFiles(options || {}, function(err, files) {
		cb(err, files);
	});
};
