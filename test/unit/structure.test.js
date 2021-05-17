let expect = require('chai').expect,
  getOptions = require('../../index').getOptions;

const optionIds = [
    'collapseFolders',
    'requestParametersResolution',
    'exampleParametersResolution',
    'indentCharacter',
    'requestNameSource',
    'folderStrategy',
    'optimizeConversion',
    'includeAuthInfoInExample'
  ],
  expectedOptions = {
    collapseFolders: {
      name: 'Collapse redundant folders',
      type: 'boolean',
      default: true,
      description: 'Importing will collapse all folders that have only one child element and lack ' +
      'persistent folder-level data.'
    },
    requestParametersResolution: {
      name: 'Request parameter generation',
      type: 'enum',
      default: 'Schema',
      availableOptions: ['Example', 'Schema'],
      description: 'Select whether to generate the request parameters based on the' +
      ' [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schemaObject) or the' +
      ' [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#exampleObject)' +
      ' in the schema.'
    },
    exampleParametersResolution: {
      name: 'Response parameter generation',
      type: 'enum',
      default: 'Example',
      availableOptions: ['Example', 'Schema'],
      description: 'Select whether to generate the response parameters based on the' +
      ' [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schemaObject) or the' +
      ' [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#exampleObject)' +
      ' in the schema.'
    },
    indentCharacter: {
      name: 'Set indent character',
      type: 'enum',
      default: 'Space',
      availableOptions: ['Space', 'Tab'],
      description: 'Option for setting indentation character'
    },
    requestNameSource: {
      name: 'Naming requests',
      type: 'enum',
      default: 'Fallback',
      availableOptions: ['Url', 'Fallback'],
      description: 'Determines how the requests inside the generated collection will be named.' +
      ' If “Fallback” is selected, the request will be named after one of the following schema' +
      ' values: `description`, `operationid`, `url`.'
    },
    folderStrategy: {
      name: 'Folder organization',
      type: 'enum',
      default: 'Paths',
      availableOptions: ['Paths', 'Tags'],
      description: 'Select whether to create folders according to the spec’s paths or tags.'
    },
    optimizeConversion: {
      name: 'Optimize conversion',
      id: 'optimizeConversion',
      type: 'boolean',
      default: true,
      description: 'Optimizes conversion for large specification, disabling this option might affect' +
        ' the performance of conversion.'
    },
    includeAuthInfoInExample: {
      name: 'Include auth info in example requests',
      type: 'boolean',
      default: true,
      description: 'Select whether to include authentication parameters in the example request'
    }
  };

describe('getOptions', function() {
  let options = getOptions();

  it('must be a valid id and should be present in the whitelist of options id', function () {
    options.forEach((option) => {
      expect(option.id).to.be.oneOf(optionIds);
    });
  });

  it('must have a valid structure', function () {
    options.forEach((option) => {
      expect(option).to.have.property('name');
      expect(option).to.have.property('id');
      expect(option).to.have.property('type');
      expect(option).to.have.property('default');
      expect(option).to.have.property('description');
    });
  });

  it('must have consistent type, description and name', function () {
    options.forEach((option) => {
      if (expectedOptions[option.id]) {
        expect(option).to.have.property('description');
        expect(option.name).to.be.eql(expectedOptions[option.id].name);
        expect(option.type).to.be.eql(expectedOptions[option.id].type);
        expect(option.description).to.be.eql(expectedOptions[option.id].description);
      }
      else {
        console.warn(`Option ${option.name} not present in the list of expected options.`);
      }
    });
  });
});
