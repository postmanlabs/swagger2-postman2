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
    let definedOptions = _.keyBy(Converter.getOptions(), 'id');

    // set default options
    for (let id in definedOptions) {
      if (definedOptions.hasOwnProperty(id)) {
        // set the default value to that option if the user has not defined
        if (options[id] === undefined) {
          options[id] = definedOptions[id].default;

          // ignore case-sensitivity for enum option with type string
          if (definedOptions[id].type === 'enum' && _.isString(options[id])) {
            options[id] = _.toLower(definedOptions[id].default);
          }
          continue;
        }
        // set the default value if the type is unknown
        switch (definedOptions[id].type) {
          case 'boolean':
            if (typeof options[id] !== definedOptions[id].type) {
              options[id] = definedOptions[id].default;
            }
            break;
          case 'enum':
            // ignore case-sensitivity for string options
            if ((definedOptions[id].availableOptions.includes(options[id])) ||
              (_.isString(options[id]) &&
              _.map(definedOptions[id].availableOptions, _.toLower).includes(_.toLower(options[id])))) {
              // Keep option as is
            }
            else {
              options[id] = definedOptions[id].default;
            }

            // ignore case-sensitivity for string options
            _.isString(options[id]) && (options[id] = _.toLower(options[id]));

            break;
          default:
            options[id] = definedOptions[id].default;
        }
      }
    }
    // We can't expose this option to the user
    options.schemaFaker = true;

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
        name: 'Naming requests',
        id: 'requestNameSource',
        type: 'enum',
        default: 'Fallback',
        availableOptions: ['URL', 'Fallback'],
        description: 'Determines how the requests inside the generated collection will be named.' +
        ' If “Fallback” is selected, the request will be named after one of the following schema' +
        ' values: `description`, `operationid`, `url`.',
        external: true
      },
      {
        name: 'Set indent character',
        id: 'indentCharacter',
        type: 'enum',
        default: 'Space',
        availableOptions: ['Space', 'Tab'],
        description: 'Option for setting indentation character',
        external: true
      },
      {
        name: 'Collapse redundant folders',
        id: 'collapseFolders',
        type: 'boolean',
        default: true,
        description: 'Importing will collapse all folders that have only one child element and lack ' +
        'persistent folder-level data.',
        external: true
      },
      {
        name: 'Request parameter generation',
        id: 'requestParametersResolution',
        type: 'enum',
        default: 'Schema',
        availableOptions: ['Example', 'Schema'],
        description: 'Select whether to generate the request parameters based on the' +
        ' [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schemaObject) or the' +
        ' [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#exampleObject)' +
        ' in the schema.',
        external: true
      },
      {
        name: 'Response parameter generation',
        id: 'exampleParametersResolution',
        type: 'enum',
        default: 'Example',
        availableOptions: ['Example', 'Schema'],
        description: 'Select whether to generate the response parameters based on the' +
        ' [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schemaObject) or the' +
        ' [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#exampleObject)' +
        ' in the schema.',
        external: true
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
