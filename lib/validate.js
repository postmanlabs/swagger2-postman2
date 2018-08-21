// Exports the validate function for the plugin
/**
jsonOrString - the input which needs to be validated
returnObject (default false) - if true, also returns a swagger object after parsing
*/
var Helpers = require('./helpers.js');

module.exports = function(input) {
  try {
    var data, parseResult;

    if (input.type === 'string') {
      data = input.data;
    }
    else if (input.type === 'json') {
      data = JSON.stringify(input.data);
    }
    else if (input.type === 'file') {
      data = fs.readFileSync(input.data).toString();
    }
    else {
      return {
        result: false,
        reason: 'input type is not valid'
      };
    }

    parseResult = Helpers.parse(data);

    if (!parseResult.result) {
      return {
        result: false,
        reason: parseResult.reason
      };
    }

    return {
      result: true
    };
  }
  catch (e) {
    return {
      result: false,
      reason: e.toString()
    };
  }
};
