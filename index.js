// Exports the interface for the plugin
module.exports = {
	validate: require('./lib/validate'),
	convert: require('./lib/convert'),
	collapse: require('./lib/collapse'),
	merge: require('./lib/merge')
};
