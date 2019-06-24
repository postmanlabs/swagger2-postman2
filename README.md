# swagger2-Postman

[![Build Status](https://travis-ci.com/postmanlabs/swagger2-postman2.svg?branch=develop)](https://travis-ci.com/postmanlabs/swagger2-postman2)

Converter for swagger 2.0 JSON to Postman Collection v2
Exports the following functions:

*<ValidationResult> validate(JSON-or-string)*: Formats like RAML/cURL don't have a JSON representation. For others, JSON is preferred. The result should be an object: `{result: true/false, reason: 'string'}`. Reason must be populated if the result is false. This function will be used by the app to determine whether or not this converter can be used for the given input.

*<Conversion result> convert(JSON-or-string)*: Converts the input to a collection object. Conversion result should be an object: `{result: true/false, reason: '', output:[{type: 'collection', data: <object>}]` Reason must be populated if the result is false. Collection must be populated if result is true.

# Conversion Schema
| *Postman* | *Swagger2* | options | examples |
| --- | --- | :---: | :---: |
| collectionName | info.title | - | - |
| description | info.description | - | - |
| folderName | paths.path | - | - |
| requestName| method.summary \|\| method.operationId \|\| request.url.raw(in postman) | default('operationId') -(`requestName`) enum[['operationId','summary','url'] | - |
| request.method | path.method (`all possible http methods`) | - | - |
| request.headers | params (`in = header` ) | - |<a href="#header/path/query_example">here</a>|
| request.body | params (`in = body or formBody`) | default(true)-(`schemaFaker`)use json-schema-faker for body conversion | <a href="#body_example">here</a> |
| request.url.raw | scheme(http or https) + '://' + host + basePath | - | - |
| request.url.params | params (`in = query`)| - | <a href="#header/path/query_example">here</a> |
| request.url.variables | params (`in = path`) | - | <a href="#header/path/query_example">here</a> |
| Content-Type header | consumes | default(true) - add consumes to header | - |
| Accept header | produces | default(true) - add produces to header | - |
| apikey in (query or header) | securityDefinitions(`type = apiKey`) | - | - |

### <a name="header/path/query_example"></a>Header/Query/Path param conversion example
| swagger | postman |
| --- | --- |
| name: api-key	<br/>description: session token<br/>in: header<br/>type: integer<br/>default: defaultValue |{<br/>&emsp;"key": "api-key",<br/>&emsp;"value": defaultValue,<br/>&emsp;"description": "session token"<br>}|
### <a name="body_example"></a> Body param conversion example
#### If `in = body`
| swagger | postman |
| --- | --- |
|name: role-id<br/>description: role identifier number<br/>in: body<br/>schema: \<schemaObject\>|"body": {<br/>&emsp;"mode": "raw",<br/>&emsp;"raw": json-schema-faker(\<schemaObject\>)<br/>}|
#### If `in = formData` and `consumes = application/x-www-form-urlencoded` 
| swagger | postman |
| --- | --- |
|name: role-id<br/>description: role identifier number<br/>in: formData<br/>default: defaultValue|"body": {<br/>&emsp;"mode": "urlencoded",<br/>&emsp;"urlencoded": [{<br/>&emsp;&emsp;"key": "role-id",<br/>&emsp;&emsp;"value": defaultValue,<br>&emsp;&emsp;"type": "text",<br>&emsp;}]<br/>}|
> All parmas with above condition are added to urlencoded array.<br>
#### If `in = formData` and `consumes = multipart/form-data` 
| swagger | postman |
| --- | --- |
|name: role-id<br/>description: role identifier number<br/>in: formData<br/>default: defaultValue|"body": {<br/>&emsp;"mode": "formdata",<br/>&emsp;"formdata": [{<br/>&emsp;&emsp;"key": "role-id",<br/>&emsp;&emsp;"value": defaultValue,<br>&emsp;&emsp;"type": "text",<br>&emsp;}]<br/>}|
> All parmas with above condition are added to formdata array.