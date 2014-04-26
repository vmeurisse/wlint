
module.exports = function() {
	require('./wlint').lint({folder: '.'}, function(err, lint) {
		var status = err ? 1 : lint.length ? 2 : 0;
		require('exit')(status);
	});
};
