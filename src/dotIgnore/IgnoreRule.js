var wildmatch = require('wildmatch');

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

module.exports = IgnoreRule;
