var expect = require('chai').expect,
  Converter = require('../../index.js'),
  Helpers = require('../../lib/helpers.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_SWAGGER_PATH = '../data/valid_swagger',
  INVALID_SWAGGER_PATH = '../data/invalid_swagger';

/* global describe, it */
describe('The converter must identify valid specs: ', function () {
  var pathPrefix = VALID_SWAGGER_PATH,
    samples = fs.readdirSync(path.join(__dirname, pathPrefix));

  samples.map(function (sample) {
    var samplePath = path.join(__dirname, pathPrefix, sample);

    it(samplePath + ' as valid', function () {
      var swagger = require(samplePath),
        convertResult = Converter.validate(swagger);

      expect(convertResult.result).to.equal(true);
    });
  });
});

describe('The converter must identify invalid specs: ', function () {
  var pathPrefix = INVALID_SWAGGER_PATH,
    samples = fs.readdirSync(path.join(__dirname, pathPrefix));

  samples.map(function (sample) {
    var samplePath = path.join(__dirname, pathPrefix, sample);

    it(samplePath + ' as invalid', function () {
      var swagger = require(samplePath),
        convertResult = Converter.validate(swagger);

      expect(convertResult.result).to.equal(false);
    });
  });
});


//Helpers
describe('Helpers', function () {
  it('getBasePath should return the correct basePath', function() {
    var swagger = {
        host: 'getpostman.com',
        basePath: '/api',
        schemes: ['https']
      },
      basePath = Helpers.getBasePath(swagger);

    expect(basePath).to.equal('https://getpostman.com/api/');
  });

  it('handleParams should return the correct basePath for http', function() {
    var swagger = {
        host: 'getpostman.com',
        basePath: '/api',
        schemes: ['http']
      },
      basePath = Helpers.getBasePath(swagger);

    expect(basePath).to.equal('http://getpostman.com/api/');
  });

  it('convertSwaggerRequestToItem should use operationId when summary is not set', function() {
    var swagger = {
        host: 'getpostman.com',
        basePath: '/',
        schemes: ['http']
      },
      pathItem = {
        path: 'http://host/api/foo/bar',
        request:{summary:null, operationId:"Get a Foobar", produces:[], consumes:[]}
      },
      node = Helpers.convertSwaggerRequestToItem(swagger, pathItem);

    expect(node.name).to.equal('Get a Foobar');
  });
});

describe('The converter must convert a swagger file', function() {
  it('Sampleswagger.json', function() {
    var samplePath = fs.readFileSync(path.join(__dirname, VALID_SWAGGER_PATH, 'sampleswagger.json'), 'utf8'),
      result = Converter.convert(samplePath);

    expect(result.status).to.equal(true);
    expect(result.collection).to.have.property('info');
    expect(result.collection).to.have.property('item');
  });
});

describe('The converter must convert a swagger object', function() {
  it('Sampleswagger.json', function() {
    var samplePath = JSON.parse(
      fs.readFileSync(path.join(__dirname, VALID_SWAGGER_PATH, 'sampleswagger.json'), 'utf8')
    ),
      result = Converter.convert(samplePath);

    expect(result.status).to.equal(true);
    expect(result.collection).to.have.property('info');
    expect(result.collection).to.have.property('item');
  });
});
