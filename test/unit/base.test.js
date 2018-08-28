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
        convertResult = Converter.validate({
          type: 'json',
          data: swagger
        });

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
        convertResult = Converter.validate({
          type: 'json',
          data: swagger
        });

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

    Converter.convert({ type: 'file', data: path.join(__dirname, VALID_SWAGGER_PATH, 'sampleswagger.json') },
      {}, (err, result) => {
        console.log(err);
        expect(result.result).to.equal(true);
        expect(result.output.length).to.equal(1);
        expect(result.output[0].type).to.have.equal('collection');
        expect(result.output[0].data).to.have.property('info');
        expect(result.output[0].data).to.have.property('item');
      });
  });
});

describe('The converter must convert a swagger object', function() {
  it('Sampleswagger.json', function() {
    var samplePath = JSON.parse(
      fs.readFileSync(path.join(__dirname, VALID_SWAGGER_PATH, 'sampleswagger.json'), 'utf8')
    );

    Converter.convert({ type: 'json', data: samplePath }, {}, (err, result) => {
      expect(result.result).to.equal(true);
      expect(result.output.length).to.equal(1);
      expect(result.output[0].type).to.have.equal('collection');
      expect(result.output[0].data).to.have.property('info');
      expect(result.output[0].data).to.have.property('item');
    });
  });
});

//added from converter-spec
describe('the converter', function () {

  it('must read values from the "x-postman-meta" key', function () {
    var samplePath = path.join(__dirname, VALID_SWAGGER_PATH, 'swagger_aws.json');

    Converter.convert({ type: 'file', data: samplePath }, {}, function(err, convertResult) {
      if (err) {
        return console.log(err);
      }
      // Make sure that currentHelper and helperAttributes are processed
      convertResult.output.forEach(function(element) {
        expect(element.type).to.equal('collection');
        expect(element.data.item[0].request).to.have.key(['auth', 'body', 'header', 'method', 'name', 'url']);
        expect(element.data.item[0].request.auth.type).to.equal('awsv4');
      });
    });
  });

  it('must read values consumes/produces', function () {
    var samplePath = path.join(__dirname, VALID_SWAGGER_PATH, 'swagger_aws_2.json');

    Converter.convert({ type: 'file', data: samplePath }, {}, function(err, convertResult) {
      if (err) {
        return console.log(err);
      }
      // Make sure that consumes and produces are processed
      convertResult.output.forEach(function(element) {
        expect(element.type).to.equal('collection');
        expect(JSON.stringify(element.data.item[0].request.header[0])).to
          .equal('{"key":"Accept","value":"text/json"}');
        expect(JSON.stringify(element.data.item[0].request.header[1])).to.equal(
          '{"key":"Content-Type","value":"application/json"}');
      });
    });
  });

  // it('should obey the includeQueryParams option', function () {
  //   var options = {
  //       includeQueryParams: false
  //     },
  //     samplePath = path.join(__dirname, 'data', 'sampleswagger.json'),
  //     swagger = require(samplePath),
  //     converterWithOptions = new Swagger2Postman(options),
  //     convertWithOptionsResult = converterWithOptions.convert(swagger),
  //     converterWithoutOptions = new Swagger2Postman(),
  //     convertWithoutOptionsResult = converterWithoutOptions.convert(swagger);
  //   // Make sure that currentHelper and helperAttributes are processed

  //   expect(convertWithoutOptionsResult.collection.requests[2].url.indexOf('status=available') > -1).to.be(true);
  //   expect(convertWithOptionsResult.collection.requests[3].url.indexOf('{') === -1).to.be(true);
  //   expect(convertWithoutOptionsResult.collection.requests[3].url.indexOf('{') > 0).to.be(true);
  // });

  it('should convert path paramters to postman-compatible paramters', function () {
    var samplePath = path.join(__dirname, VALID_SWAGGER_PATH, 'swagger2-with-params.json');

    Converter.convert({ type: 'file', data: samplePath }, {}, function(err, convertResult) {
      if (err) {
        return console.log(err);
      }
      // Make sure that currentHelper and helperAttributes are processed
      convertResult.output.forEach(function(element) {
        expect(element.type).to.equal('collection');
        expect(element.data.item[0].request.url.path.indexOf(':ownerId') > -1).to.equal(true);
        expect(element.data.item[0].request.url.path.indexOf(':petId') > -1).to.equal(true);
        // expect(element.data.item[0].request.url.path.query.indexof({ key: 'ownerId',
        //   value: 42 })).to.be(true);
      });
    });
  });
});


