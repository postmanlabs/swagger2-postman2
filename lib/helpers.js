var yaml = require('js-yaml');

module.exports = {
  // Called from the exported .validate function
  parse: function (jsonOrString) {
    var swaggerObj = jsonOrString;

    if (typeof jsonOrString === 'string') {
      try {
        swaggerObj = JSON.parse(jsonOrString);
      }
      catch (jsonEx) {
        // Not direct JSON. Could be YAML
        try {
          swaggerObj = yaml.safeLoad(jsonOrString);
        }
        catch (yamlEx) {
          // Not JSON or YAML
          return {
            result: false,
            reason: 'The input must be valid JSON or YAML'
          };
        }
        // valid YAML
      }
    }

    // valid JSON

    // Check for everything that's required according to
    // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md
    if (swaggerObj.swagger !== '2.0') {
      return {
        result: false,
        reason: 'The Swagger object must have the "swagger" property set to 2.0'
      };
    }
    if (!swaggerObj.info) {
      return {
        result: false,
        reason: 'The Swagger object must have an "info" property'
      };
    }
    if (!(swaggerObj.info.title && swaggerObj.info.version)) {
      return {
        result: false,
        reason: 'The info property must have title and version defined'
      };
    }
    if (!swaggerObj.paths) {
      return {
        result: false,
        reason: 'The Swagger object must have a "paths" property'
      };
    }

    // Valid. No reason needed
    return {
      result: true,
      swagger: swaggerObj
    };
  }
};
