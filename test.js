var fs = require('fs'),
	Converter = require('./convert.js');

var file  = fs.readFileSync('test/data/sampleswagger.json', 'utf8');
var jsonObj = JSON.parse(file);
var pc = Converter.convert(jsonObj);

// fs.writeFileSync("postman-collection.json", JSON.stringify(pc.collection,null, 2));
// console.log('written');