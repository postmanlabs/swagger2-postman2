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

describe('Merge - ', function () {
  it('Two different nodes', function () {
    var left = {
      item: [{name:"item1", item:[{name:"inner1"}]}]
    },
    right = {
      item: [{name:"Item2", item:[{name:"inner2"}]}]
    },
    result = Converter.merge(left, right);

    expect(result.result).to.equal(true);
    expect(left.item.length).to.equal(2);
    expect(left.item[0].name).to.equal("item1");
    expect(left.item[1].name).to.equal("Item2");
    expect(left.item[0].item[0].name).to.equal("inner1");
    expect(left.item[1].item[0].name).to.equal("inner2");
  });

  it('Right request overrides left', function () {
    var left = {
      item: [{name:"item1", item:[{name:"inner1", request:"nonNull"}]}]
    },
    right = {
      item: [{name:"Item1", item:[{name:"inner1", request:"nonNull2"}]}]
    },
    result = Converter.merge(left, right);

    expect(result.result).to.equal(true);
    expect(left.item.length).to.equal(1);
    expect(left.item[0].name).to.equal("Item1");
    expect(left.item[0].item[0].name).to.equal("inner1");
    expect(left.item[0].item[0].request).to.equal("nonNull2");
  });
});


describe('Compress - ', function () {
  it('With requests is uncompressed', function () {
    var tree = {
      name: "root",
      item: [
        {
          name:"level1", 
          request:"request",
          item:[
            {
              name:"level2",
              item:[]}]}]
    },
    result = Converter.collapse(tree);
    
    expect(result.result).to.equal(true, result.reason);
    expect(tree.item[0].item[0].name).to.equal("level2");
  });

  it('Empty folders are compressed', function () {
    var tree = {
      name: "root",
      item: [
        {
          name:"level1", 
          item:[
            {
              name:"level2",
              item:[]}]}]
    },
    result = Converter.collapse(tree);
    
    expect(result.result).to.equal(true, result.reason);
    expect(tree.item.length).to.equal(0);
    expect(tree.name).to.equal("root/.../level2");
  });
});
