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
describe.skip('Helpers', function () {
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

  it('should generate the correct request names for PathItems', function(done) {
    var swagger = {
      swagger: '2.0',
      host: 'getpostman.com',
      basePath: '/api',
      schemes: ['http'],
      info: {
        description: 'My API',
        version: '1.0.0',
        title: 'My API',
        termsOfService: 'http://www.domain.com',
        contact: {
          name: 'support@domain.com'
        }
      },
      paths: {
        req1: {
          post: {
            operationId: 'req1'
          }
        },
        req2: {
          post: {
          }
        },
        req3: {
          post: {
            summary: 'req3'
          }
        }
      }
    };

    Converter.convert({ type: 'json', data: swagger }, {}, (err, result) => {
      expect(result.output[0].data.item[0].name).to.equal('req1'); // from operationId
      expect(result.output[0].data.item[1].name).to.equal('http://getpostman.com/api/req2'); // from URL
      expect(result.output[0].data.item[2].name).to.equal('req3'); // from summary
      done();
    });
  });
});

describe('The converter must convert a swagger object', function() {
  it('Sampleswagger.json', function(done) {
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
    done();
  });
});

describe('The converter must convert a swagger string', function() {
  it('Sampleswagger.json', function(done) {
    var sampleString = fs.readFileSync(path.join(__dirname, VALID_SWAGGER_PATH, 'sampleswagger.json'), 'utf8');

    Converter.convert({ type: 'string', data: sampleString }, {}, (err, result) => {
      expect(result.result).to.equal(true);
      expect(result.output.length).to.equal(1);
      expect(result.output[0].type).to.have.equal('collection');
      expect(result.output[0].data).to.have.property('info');
      expect(result.output[0].data).to.have.property('item');
    });
    done();
  });
});

//added from converter-spec
describe('the converter', function () {

  it('must read values consumes', function (done) {
    var samplePath = path.join(__dirname, VALID_SWAGGER_PATH, 'swagger_aws_2.json');

    Converter.convert({ type: 'file', data: samplePath }, { requestName: 'url' }, function(err, convertResult) {
      expect(err).to.be.null;
      // Make sure that consumes and produces are processed
      convertResult.output.forEach(function(element) {
        expect(element.type).to.equal('collection');
        expect(JSON.stringify(element.data.item[0].request.header[0])).to
          .equal('{"key":"Content-Type","value":"application/json"}');
      });
      done();
    });
  });

  it('should convert path paramters to postman-compatible paramters', function (done) {
    var samplePath = path.join(__dirname, VALID_SWAGGER_PATH, 'swagger2-with-params.json');

    Converter.convert({ type: 'file', data: samplePath }, {}, function(err, convertResult) {
      expect(err).to.be.null;
      // Make sure that path params are updated and their respective default values
      convertResult.output.forEach(function(element) {
        expect(element.type).to.equal('collection');
        expect(element.data.item[0].request.url.path.indexOf(':ownerId') > -1).to.equal(true);
        expect(element.data.item[0].request.url.path.indexOf(':petId') > -1).to.equal(true);

        let thisVar = element.data.item[0].request.url.variable[0];

        expect(thisVar.type).to.equal('any');
        expect(thisVar.value).to.equal('42');
        expect(thisVar.key).to.equal('ownerId');
      });
      done();
    });
  });
});


