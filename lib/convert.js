var _ = require('lodash'),
  Helpers = require('./helpers.js'),
  Swagger2OpenAPI = require('swagger2openapi'),
  OpenAPI2Postman = require('openapi-to-postmanv2'),
  Converter = null,
  fs = require('fs');

Converter = {
  // Static Props:
  collection: null, // will hold the V2 collection object


  // takes in a swagger2 JSON object
  // returns a V2 collection JSON object
  convert: function (input, options, callback) {
    options = _.assign({}, options);

    var parseResult = Helpers.parse(input);

    if (!parseResult.result) {
      return callback(new Error(parseResult.reason || 'Invalid input'));
    }
    try {
      return Swagger2OpenAPI.convertObj(parseResult.swagger, {
        fatal: false,
        warnOnly: true
      }, function(err, oas3Wrapper) {
        if (err) {
          return callback(err);
        }

        return OpenAPI2Postman.convert({
          type: 'json',
          data: oas3Wrapper.openapi
        }, options, (error, result) => {
          if (error) {
            return callback('Error importing Swagger 2.0 spec');
          }

          return callback(null, result);
        });
      });
    }
    catch (e) {
      return callback(e);
    }
  },

  getOptions: function() {
    return [
      {
        name: 'Set request name source',
        id: 'requestNameSource',
        type: 'string',
        default: 'fallback',
        description: 'Option for setting source for a request name'
      },
      {
        name: 'Toggle for faking schema',
        id: 'schemaFaker',
        type: 'boolean',
        default: true,
        description: 'Option for faking the schema using JSON or XML schema faker'
      },
      {
        name: 'Set indent character',
        id: 'indentCharacter',
        type: 'string',
        default: ' ',
        description: 'Option for setting indentation character'
      },
      {
        name: 'Toggle for collapsing folder for long routes',
        id: 'collapseFolders',
        type: 'boolean',
        default: true,
        description: 'Collapse folders in case of long routes leading to unnecessary folders'
      },
      {
        name: 'Set root request parameters type',
        id: 'requestParametersResolution',
        type: 'string',
        default: 'schema',
        description: 'Option for setting root request body between schema or example'
      },
      {
        name: 'Set example request and response parameters type',
        id: 'exampleParametersResolution',
        type: 'string',
        default: 'example',
        description: 'Option for setting example request and response body between schema or example'
      },
      {
        name: 'Set folder strategy',
        id: 'folderStrategy',
        type: 'string',
        default: 'paths',
        description: 'Option for setting folder creating strategy between paths or tags'
      }
    ];
  }
};

// Exports the convert function for the plugin
module.exports = {
  convert: function(input, options, cb) {
    if (input.type === 'string') {
      return Converter.convert(input.data, options, cb);
    }
    else if (input.type === 'json') {
      return Converter.convert(JSON.stringify(input.data), options, cb);
    }
    else if (input.type === 'file') {
      return fs.readFile(input.data, 'utf8', function(err, data) {
        if (err) {
          return cb(err);
        }

        return Converter.convert(data, options, cb);
      });
    }

    return cb(null, {
      result: false,
      reason: 'input type is not valid'
    });
  },
  getOptions: Converter.getOptions
};
