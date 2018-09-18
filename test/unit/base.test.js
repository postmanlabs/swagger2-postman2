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
      basePath = Helpers.generateUrl(swagger);

    expect(basePath).to.equal('https://getpostman.com/api/');
  });

  it('handleParams should return the correct basePath for http', function() {
    var swagger = {
        host: 'getpostman.com',
        basePath: '/api',
        schemes: ['http']
      },
      basePath = Helpers.generateUrl(swagger);

    expect(basePath).to.equal('http://getpostman.com/api/');
  });
});

describe('The converter must convert a swagger file', function() {
  it('Sampleswagger.json', function(done) {

    Converter.convert({ type: 'file', data: path.join(__dirname, VALID_SWAGGER_PATH, 'sampleswagger.json') },
      {}, (err, result) => {
        expect(err).to.be.null;
        expect(result.result).to.equal(true);
        expect(result.output.length).to.equal(2);
        expect(result.output[0].type).to.have.equal('collection');
        expect(result.output[0].data).to.have.property('info');
        expect(result.output[0].data).to.have.property('item');
      });
    done();
  });
});

describe('The converter must convert a swagger object', function() {
  it('Sampleswagger.json', function(done) {
    var samplePath = JSON.parse(
      fs.readFileSync(path.join(__dirname, VALID_SWAGGER_PATH, 'sampleswagger.json'), 'utf8')
    );

    Converter.convert({ type: 'json', data: samplePath }, {}, (err, result) => {
      expect(result.result).to.equal(true);
      expect(result.output.length).to.equal(2);
      expect(result.output[0].type).to.have.equal('collection');
      expect(result.output[0].data).to.have.property('info');
      expect(result.output[0].data).to.have.property('item');
    });
    done();
  });
});

//added from converter-spec
describe('the converter', function () {
  it('must create environment with url variable', function (done) {
    var samplePath = path.join(__dirname, VALID_SWAGGER_PATH, 'swagger_aws.json');

    Converter.convert({ type: 'file', data: samplePath }, { requestName: 'url' }, function(err, convertResult) {
      expect(err).to.be.null;
      expect(convertResult.output[1].type).to.equal('environment');
      expect(convertResult.output[1].data.values).to.deep.include({ key: 'url',
        value: 'https://execute-api.us-east-1.amazonaws.com/',
        enabled: true,
        type: 'text' });
      done();
    });
  });

  it('must read values from the "x-postman-meta" key', function (done) {
    var samplePath = path.join(__dirname, VALID_SWAGGER_PATH, 'swagger_aws.json');

    Converter.convert({ type: 'file', data: samplePath }, { requestName: 'url' }, function(err, convertResult) {
      expect(err).to.be.null;
      // Make sure that currentHelper and helperAttributes are processed
      var element = convertResult.output[0];

      expect(element.type).to.equal('collection');
      expect(element.data.item[0].request).to.have.key(['auth', 'body', 'header', 'method', 'name', 'url']);
      expect(element.data.item[0].request.auth.type).to.equal('awsv4');
      done();
    });
  });

  it('must read values consumes/produces', function (done) {
    var samplePath = path.join(__dirname, VALID_SWAGGER_PATH, 'swagger_aws_2.json');

    Converter.convert({ type: 'file', data: samplePath }, { requestName: 'url' }, function(err, convertResult) {
      expect(err).to.be.null;
      // Make sure that consumes and produces are processed
      var element = convertResult.output[0];

      expect(element.type).to.equal('collection');
      expect(JSON.stringify(element.data.item[0].request.header[0])).to
          .equal('{"key":"Content-Type","value":"application/json"}');
      expect(JSON.stringify(element.data.item[0].request.header[1])).to
        .equal('{"key":"Accept","value":"text/json"}');
      done();
    });
  });

  it('should convert path paramters to postman-compatible paramters', function (done) {
    var samplePath = path.join(__dirname, VALID_SWAGGER_PATH, 'swagger2-with-params.json');

    Converter.convert({ type: 'file', data: samplePath }, {}, function(err, convertResult) {
      expect(err).to.be.null;
      // Make sure that path params are updated and their respective default values
      var element = convertResult.output[0];

      expect(element.type).to.equal('collection');
      expect(element.data.item[0].request.url.path.indexOf(':ownerId') > -1).to.equal(true);
      expect(element.data.item[0].request.url.path.indexOf(':petId') > -1).to.equal(true);
      expect(element.data.item[0].request.url.variable).to.deep.include({ type: 'any',
          value: '{{ownerId}}', key: 'ownerId' });
      done();
    });
  });
});


