var Collection = require('postman-collection').Collection,
  _ = require('lodash'),
  Helpers = require('./helpers.js'),
  Converter = null;

Converter = {
  // Static Props:
  collection: null, // will hold the V2 collection object

  createCollectionStructure: function (swaggerData, tree) {
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
  convert: function (json) {
    // No validation needed. If the app didn't call validate, this will throw an error
    var result = {
        status: true,
        collecion: null,
        reason: null
      },
      parseResult,
      swaggerData = {},
      tree;

    if (typeof json === 'string') {
      //parse
      parseResult = Helpers.parse(json);
      if (!parseResult.result) {
        throw new Exception('Invalid Swagger object');
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

    result.collection = this.collection.toJSON();

    return result;
  }
};

// Exports the convert function for the plugin
module.exports = function (json) {
  return Converter.convert(json);
};
