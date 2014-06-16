var fs = require('fs');
var pathUtils = require('path');

var stripJsonComments = require('strip-json-comments');

var IgnoreRule = require('./dotIgnore/IgnoreRule');
var validators = require('./validators');

var CACHE = {};
var CONF_NAME = '.wlint.json';
var DEFAULTS = {};

var mergeConfig = function(config, defaults) {
	delete config.extend;
	for (var key in defaults) {
		if (!config[key]) config[key] = {};
		if (validators[key]) {
			validators[key].mergeConfig(config[key], defaults[key]);
		}
	}
};

var mergeConfigs = function(confs, fileName) {
	var conf = {};
	confs.forEach(function(confFile) {
		if (confFile.overrides) {
			var overrides = confFile.getOverrides(fileName);
			for (var i = overrides.length - 1; i >= 0; i--) {
				var override = overrides[i];
				mergeConfig(conf, override.config);
			}
		}
		mergeConfig(conf, confFile.config);
	});
	
	return conf;
};

function ConfigFile(path, data) {
	this.path = path;
	if (!data) {
		this.empty = true;
	} else {
		this.config = JSON.parse(stripJsonComments(data));
		if (this.config.overrides) {
			this.overrides = this.config.overrides;
			this.pathLength = pathUtils.dirname(this.path).length;
			this.overrides.forEach(function(override) {
				override.path = new IgnoreRule(override.path);
			}, this);
			
			delete this.config.overrides;
		}
	}
}

ConfigFile.prototype.getOverrides = function(path) {
	if (!this.overrides) return null;
	path = path.slice(this.pathLength + 1);
	
	return this.overrides.filter(function(override) {
		return override.path.match(path) !== override.path.negated; // XOR
	});
};

var readConfFile = function(path, cb) {
	if (CACHE[path]) return cb(null, CACHE[path]);
	
	fs.readFile(path, {encoding: 'UTF-8'}, function(e, data) {
		CACHE[path] = new ConfigFile(path, data);
		return cb(null, CACHE[path]);
	});
};

var readConfig = function(filePath, folderPath, cb) {
	readConfFile(filePath, function(err, conf) {
		if (conf.empty) {
			conf = [];
		} else {
			conf = [conf];
		}
		if (conf.extend) {
			if (DEFAULTS[conf.extends]) {
				conf = conf.concat(DEFAULTS[conf.extends]);
			} else {
				var parentPath = pathUtils.resolve(folderPath, conf.extend);
				var parentFolder = pathUtils.dirname(parentPath);
				readConfig(parentPath, parentFolder, function(err, parentConf) {
					cb(err, conf.concat(parentConf));
				});
			}
		}
		return cb(err, conf);
	});
};

var findConfig = function(folderPath, cb) {
	var filePath = pathUtils.join(folderPath, CONF_NAME);
	readConfig(filePath, folderPath, function(err, conf) {
		if (err || conf.length) {
			cb(err, conf);
		} else {
			var parent = pathUtils.resolve(folderPath, '..');
			if (parent === folderPath) return cb('No config file found');
			return findConfig(parent, cb);
		}
	});
};

exports.load = function(filePath, cb) {
	var folderPath = pathUtils.dirname(pathUtils.normalize(filePath));
	findConfig(folderPath, function(err, conf) {
		setImmediate(cb.bind(null, null, mergeConfigs(conf, filePath)));
	});
};

exports.addPreset = function(name, data) {
	data = [new ConfigFile('', data)];
	if (data.extend) {
		if (!DEFAULTS[data.extend]) throw new Error('Cannot extend non-existing preset ' + data.extend);
		data = data.concat[DEFAULTS[data.extend]];
	}
	DEFAULTS[name] = data;
};
