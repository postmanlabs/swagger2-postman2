var fs = require('fs'),
	SC = require('./convert2.js');

// var file  = fs.readFileSync('test/data/swagger-with-path.json', 'utf8');
var file  = fs.readFileSync('test/data/sampleswagger.json', 'utf8');
var jsonObj = JSON.parse(file);
var pc = SC.convert(jsonObj);

fs.writeFileSync("collection.json", JSON.stringify(pc.collection,null, 2));
console.log('written');