var converter = require('../index.js'),
  expect = require('expect.js'),
  path = require('path');

/* global describe, it */
describe('the converter', function () {

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

  it('must read values consumes/produces', function () {
    var samplePath = path.join(__dirname, 'data/valid_swagger', 'swagger_aws_2.json');

    converter.convert({ type: 'file', data: samplePath }, {}, function(err, convertResult) {
      if (err) {
        return console.log(err);
      }
      // Make sure that currentHelper and helperAttributes are processed
      convertResult.output.forEach(function(element) {
        expect(element.type).to.equal('collection');
        expect(JSON.stringify(element.data.item[0].request.header[0])).to.equal('{"key":"Accept","value":"text/json"}');
        expect(JSON.stringify(element.data.item[0].request.header[0])).to.equal(
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
