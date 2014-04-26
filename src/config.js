var fs = require('fs');
var pathUtils = require('path');

var stripJsonComments = require('strip-json-comments');

var validators = require('./validators');

var CACHE = {};
var CONF_NAME = '.wlint.json';
var DEFAULTS = {};
var NO_FILE = {};

var mergeConfig = function(config, defaults) {
	delete config.extend;
	for (var key in defaults) {
		if (!config[key]) config[key] = {};
		if (validators[key]) {
			validators[key].mergeConfig(config[key], defaults[key]);
		}
	}
};

var loadFile = function(path, cb) {
	if (NO_FILE[path]) return cb();
	
	fs.readFile(path, {encoding: 'UTF-8'}, function(e, data) {
		if (!data) {
			NO_FILE[path] = true;
			return cb();
		}
		
		var conf = JSON.parse(stripJsonComments(data));
		if (!conf.extend) return cb(null, conf);
		if (DEFAULTS[conf.extend]) return cb(null, mergeConfig(conf, DEFAULTS[conf.extend]));
		loadFile(conf.extend, function(err, defaults) {
			if (err) return cb(err);
			if (!defaults) return cb('Cannot find defaults config at ' + conf.extend);
			cb(null, mergeConfig(conf, defaults));
		});
	});
};

var load = function(path, cb) {
	if (CACHE[path]) return cb(null, CACHE[path]);
	
	loadFile(pathUtils.join(path, CONF_NAME), function(err, conf) {
		if (err || conf) {
			CACHE[path] = conf;
			return cb(err, conf);
		}
		var parent = pathUtils.resolve(path, '..');
		if (parent === path) return cb('No config file found');
		return load(parent, function(err, conf) {
			CACHE[path] = conf;
			return cb(err, conf);
		});
	});
};

exports.load = function(path, cb) {
	path = pathUtils.normalize(path);
	load(path, function(err, conf) {
		setImmediate(cb.bind(null, null, conf));
	});
};

exports.addPreset = function(name, data) {
	if (data.extend) {
		if (!DEFAULTS[data.extend]) throw new Error('Cannot extend non-existing preset ' + data.extend);
		data = mergeConfig(data, DEFAULTS[data.extend]);
	}
	DEFAULTS[name] = data;
};
