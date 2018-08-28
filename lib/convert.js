var Collection = require('postman-collection').Collection,
  _ = require('lodash'),
  Helpers = require('./helpers.js'),
  Converter = null,
  fs = require('fs');

Converter = {
  // Static Props:
  collection: null, // will hold the V2 collection object

  createCollectionStructure: function(swaggerData, tree) {
    // this takes in the tree structure, and creates the collection struct
    // with folders and params and requests

    // Add each of the root children to the collection items
    for (var child in tree.children) {
      if (tree.children.hasOwnProperty(child)) {
        this.collection.items.add(
          Helpers.convertChildToItemGroup(swaggerData, tree.children[child])
        );
      }
    }
  },

  // takes in a swagger2 JSON object
  // returns a V2 collection JSON object
  convert: function(json, callback) {
    // No validation needed. If the app didn't call validate, this will throw an error
    try {
      var result = {
          result: true,
          output: []
        },
        parseResult,
        swaggerData = {},
        tree;

      if (typeof json === 'string') {
      //parse
        parseResult = Helpers.parse(json);
        if (!parseResult.result) {
          return callback({
            result: false,
            reason: 'Invalid Swagger object'
          });
        }
        json = parseResult.swagger;
      }

      // Set data needed for swagger->Postman conversion

      // Set schema-wide input and output formats
      swaggerData.globalConsumes = json.consumes || [];
      swaggerData.globalProduces = json.produces || [];

      // Read global properties from the JSON:
      swaggerData.basePath = Helpers.getBasePath(json);
      swaggerData.baseParams = json.parameters;

      // Read definitions, response schemas, security schemes
      swaggerData.securityDefs = json.securityDefinitions; // global auth
      swaggerData.sampleDefinitions = json.definitions; // global schema defs
      swaggerData.sampleResponses = json.responses; // global sample responses

      // Start building out collection:
      this.collection = new Collection();
      this.collection.name = json.info.title;
      this.collection.describe(json.info.description);
      this.collection.variables = _.map(swaggerData.sampleDefinitions);

      tree = Helpers.getTreeFromPaths(json);
      this.createCollectionStructure(swaggerData, tree);

      result.output.push({
        type: 'collection',
        data: this.collection.toJSON()
      });

      return callback(null, result);
    }
    catch (e) {
      return callback(e);
    }
  }
};

// Exports the convert function for the plugin
module.exports = function(input, options, cb) {
  try {
    if (input.type === 'string') {
      return Converter.convert(input.data, cb);
    }
    else if (input.type === 'json') {
      return Converter.convert(JSON.stringify(input.data), cb);
    }
    else if (input.type === 'file') {
      return fs.readFile(input.data, 'utf8', function(err, data) {
        if (err) {
          return cb(err);
        }

        return Converter.convert(data, cb);
      });
    }

    return cb(null, {
      result: false,
      reason: 'input type is not valid'
    });
  }
  catch (e) {
    return cb(e);
  }
};
