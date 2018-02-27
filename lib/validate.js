// Exports the validate function for the plugin
/**
jsonOrString - the input which needs to be validated
returnObject (default false) - if true, also returns a swagger object after parsing
*/
var Helpers = require('./helpers.js');

module.exports = function (jsonOrString) {
  var parseResult = Helpers.parse(jsonOrString);

  if (!parseResult.result) {
    return {
      result: false,
      reason: parseResult.reason
    };
  }

  return {
    result: true
  };
};
