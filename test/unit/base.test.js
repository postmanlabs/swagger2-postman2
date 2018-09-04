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

  it('should generate the correct request names for PathItems', function(done) {
    var swagger = {
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

    Converter.convert(swagger, (err, result) => {
      expect(result.output[0].data.item[0].name).to.equal('req1'); // from operationId
      expect(result.output[0].data.item[1].name).to.equal('http://getpostman.com/api/req2'); // from URL
      expect(result.output[0].data.item[2].name).to.equal('req3'); // from summary
      done();
    });
  });
});

describe('The converter must convert a swagger file', function() {
  it('Sampleswagger.json', function() {
    var samplePath = fs.readFileSync(path.join(__dirname, VALID_SWAGGER_PATH, 'sampleswagger.json'), 'utf8');

    Converter.convert(samplePath, (err, result) => {
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

    Converter.convert(samplePath, (err, result) => {
      expect(result.result).to.equal(true);
      expect(result.output.length).to.equal(1);
      expect(result.output[0].type).to.have.equal('collection');
      expect(result.output[0].data).to.have.property('info');
      expect(result.output[0].data).to.have.property('item');
    });
  });
});
