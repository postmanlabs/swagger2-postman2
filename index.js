// Exports the interface for the plugin
module.exports = {
  validate: require('./lib/validate'),
  convert: require('./lib/convert').convert,
  getOptions: require('./lib/convert').getOptions
};
