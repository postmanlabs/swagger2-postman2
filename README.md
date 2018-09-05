# swagger2-Postman
Converter for swagger 2.0 JSON to Postman Collection v2
Exports the following functions:

*<ValidationResult> validate(JSON-or-string)*: Formats like RAML/cURL don't have a JSON representation. For others, JSON is preferred. The result should be an object: `{result: true/false, reason: 'string'}`. Reason must be populated if the result is false. This function will be used by the app to determine whether or not this converter can be used for the given input.

*<Conversion result> convert(JSON-or-string)*: Converts the input to a collection object. Conversion result should be an object: `{result: true/false, reason: '', collection: <object>}` Reason must be populated if the result is false. Collection must be populated if result is true.

# Conversion Schema
| *Postman* | *Swagger2* |
| --- | --- |
| CollectionName | info.title |
| Description | info.Descirption |
| Folder | Paths.path |
| Request | Path.method (method is any http method) |
| Request.headers | params (`in = header` ) |
| Request.body | params (`in = body or formBody`)|
| Request.url.raw | host+basePath |
| Request.url.params | params (`in = query`)|
| Request.url.variables | params (`in = path`)|
| Content-Type header | consumes |
| Accept header | produces |
| Collection_Variables | definitions |
| apikey in (query or header) | securityDefinitions(type:apiKey) |