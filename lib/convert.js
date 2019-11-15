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
        type: 'enum',
        default: 'fallback',
        availableOptions: ['url', 'uKnown', 'fallback'],
        description: 'Option for setting source for a request name'
      },
      {
        name: 'Set indent character',
        id: 'indentCharacter',
        type: 'enum',
        default: ' ',
        availableOptions: [' ', '\t'],
        description: 'Option for setting indentation character'
      },
      {
        name: 'Toggle for collapsing folder for long routes',
        id: 'collapseFolders',
        type: 'boolean',
        default: true,
        description: 'Determines whether the importer should attempt to collapse redundant folders into one.' +
         'Folders are redundant if they have only one child element, and don\'t' +
         'have any folder-level data to persist.'
      },
      {
        name: 'Set root request parameters type',
        id: 'requestParametersResolution',
        type: 'enum',
        default: 'schema',
        availableOptions: ['example', 'schema'],
        description: 'Determines how request parameters (query parameters, path parameters, headers,' +
         'or the request body) should be generated. Setting this to schema will cause the importer to' +
         'use the parameter\'s schema as an indicator; `example` will cause the example (if provided)' +
         'to be picked up.'
      },
      {
        name: 'Set example request and response parameters type',
        id: 'exampleParametersResolution',
        type: 'enum',
        default: 'example',
        availableOptions: ['example', 'schema'],
        description: 'Determines how response parameters (query parameters, path parameters, headers,' +
         'or the request body) should be generated. Setting this to schema will cause the importer to' +
         'use the parameter\'s schema as an indicator; `example` will cause the example (if provided)' +
         'to be picked up.'
      },
      {
        name: 'Set folder strategy',
        id: 'folderStrategy',
        type: 'enum',
        default: 'paths',
        availableOptions: ['paths', 'tags'],
        description: 'Determines whether the importer should attempt to create the folders according' +
         'to paths or tags which are given in the spec.'
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
