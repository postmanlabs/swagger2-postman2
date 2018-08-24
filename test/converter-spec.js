var converter = require('../index.js'),
  //fs = require('fs'),
  expect = require('expect.js'),
  path = require('path');

/* global describe, it */
describe('the converter', function () {
  //var samples = fs.readdirSync(path.join(__dirname, 'data'));

  // samples.map(function (sample) {
  //   var samplePath = path.join(__dirname, 'data', sample);

  //   it('must convert ' + samplePath + ' to a postman collection', function () {
  //     var swagger = require(samplePath),
  //       converter = new Swagger2Postman(),
  //       convertResult = converter.convert(swagger);

  //     expect(convertResult.status).to.be('passed');
  //   });
  // });

  // it('must read values from the "x-postman-meta" key', function () {
  //   var samplePath = path.join(__dirname, 'data/valid_swagger', 'swagger_aws.json'),
  //     swagger = require(samplePath),
  //     converter = new Swagger2Postman();

  //   converter.convert({ type: path, data: swagger }, function(err, convertResult) {
  //     if (err) {
  //       console.log(e);
  //     }
  //     // Make sure that currentHelper and helperAttributes are processed
  //     convertResult.output.forEach(function(element) {
  //       expect(element.type).to.equal('collection');
  //       expect(element.data.item[0].requests[0]).to.have.key('currentHelper');
  //       expect(convertResult.collection.requests[0]).to.have.key('helperAttributes');
  //     });
  //   });


  // });

  // it('must read values consumes/produces', function () {
  //   var samplePath = path.join(__dirname, 'data', 'swagger_aws_2.json'),
  //     swagger = require(samplePath),
  //     converter = new Swagger2Postman(),
  //     convertResult = converter.convert(swagger),
  //     request = convertResult.collection.requests[0];
  //   // Make sure that currentHelper and helperAttributes are processed

  //   expect(request.headers.indexOf('Accept: text/json') > -1).to.be(true);
  //   expect(request.headers.indexOf('Content-Type: application/json') > -1).to.be(true);
  // });

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
    var samplePath = path.join(__dirname, 'data/valid_swagger', 'swagger2-with-params.json');
    //swagger = require(samplePath);
    //converter = new Swagger2Postman();

    converter.convert({ type: 'file', data: samplePath }, {}, function(err, convertResult) {
      if (err) {
        return console.log(err);
      }
      // Make sure that currentHelper and helperAttributes are processed
      convertResult.output.forEach(function(element) {
        expect(element.type).to.equal('collection');
        expect(element.data.item[0].request.url.path.indexOf(':ownerId') > -1).to.be(true);
        expect(element.data.item[0].request.url.path.indexOf(':petId') > -1).to.be(true);
        // expect(element.data.item[0].request.url.path.query.indexof({ key: 'ownerId',
        //   value: 42 })).to.be(true);
      });
    });
  });
});
