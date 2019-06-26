var jsf = require('json-schema-faker')
var postman_collection = require('postman-collection')

var ItemGroup = postman_collection.ItemGroup

var Item = postman_collection.Item

var Request = postman_collection.Request

var Response = postman_collection.Response

var RequestBody = postman_collection.RequestBody

var url = require('url')

var yaml = require('js-yaml')

var _ = require('lodash')

var META_KEY = 'x-postman-meta'

var RequestAuth = postman_collection.RequestAuth

var authMap = {
  basicAuth: 'basic',
  bearerAuth: 'bearer',
  digestAuth: 'digest',
  hawkAuth: 'hawk',
  oAuth1: 'oauth1',
  oAuth2: 'oauth2',
  ntlmAuth: 'ntlm',
  awsSigV4: 'awsv4',
  normal: null
}

module.exports = {
  options: {},
  // sets collection basePath according to swagger basePath and schemes
  getBasePath: function (swagger) {
    var basePath = ''

    if (swagger.host) {
      basePath = swagger.host
    }
    if (swagger.basePath) {
      basePath += swagger.basePath
    }

    if (swagger.schemes && swagger.schemes.indexOf('https') !== -1) {
      basePath = 'https://' + basePath
    } else {
      basePath = 'http://' + basePath
    }

    if (!basePath.endsWith('/')) {
      basePath += '/'
    }

    return basePath
  },

  // Combines all params for a swagger path
  // Headers / body / path etc.
  getParamsForPathItem: function (swaggerData, paramArray) {
    var retVal = {}

    var i

    var j

    var lenI

    var lenJ

    var parts

    var lastPart

    var paramGroup

    var getBaseParam

    for (i = 0, lenI = paramArray.length; i < lenI; i++) {
      paramGroup = paramArray[i]
      if (paramGroup instanceof Array) {
        for (j = 0, lenJ = paramGroup.length; j < lenJ; j++) {
          if (paramGroup[j].$ref) {
            // this is a ref
            if (paramGroup[j].$ref.indexOf('#/parameters') === 0) {
              parts = paramGroup[j].$ref.split('/')
              lastPart = parts[parts.length - 1]
              getBaseParam = swaggerData.baseParams[lastPart]
              retVal[lastPart] = getBaseParam
            }
          } else {
            retVal[paramGroup[j].name] = paramGroup[j]
          }
        }
      }
    }

    return retVal
  },

  convertChildToItemGroup: function (swaggerData, child) {
    var thisItemGroup, thisItem, rCount, subChild, i, oneRequest
    // child will be a folder or request
    // depending on the type

    if (child.type === 'group') {
      // folder
      if (child.requestCount > 1) {
        // Folder with more than 1 request
        // Should be converted to a folder
        thisItemGroup = new ItemGroup({
          name: child.name
        })
        for (subChild in child.children) {
          if (child.children.hasOwnProperty(subChild)) {
            thisItemGroup.items.add(this.convertChildToItemGroup(swaggerData, child.children[subChild]))
          }
        }
        for (i = 0, rCount = child.requests.length; i < rCount; i++) {
          thisItemGroup.items.add(this.convertChildToItemGroup(swaggerData, child.requests[i]))
        }
        var members = thisItemGroup.items.members
        members.sort((a, b) => (a.name > b.name ? 1 : -1))
        thisItemGroup.items.members = members
        return thisItemGroup
      }

      // folder only has one request
      // no need to nest
      // just create a request from the one endpoint it has
      oneRequest = this.getSingleSwaggerRequestFromFolder(child)
      if (oneRequest) {
        return this.convertSwaggerRequestToItem(swaggerData, oneRequest)
      }

      return null
    }

    // request
    thisItem = this.convertSwaggerRequestToItem(swaggerData, child)

    return thisItem
  },

  getSingleSwaggerRequestFromFolder: function (swaggerChild) {
    var childName

    if (swaggerChild.requests.length > 0) {
      return swaggerChild.requests[0]
    }
    for (childName in swaggerChild.children) {
      if (swaggerChild.children.hasOwnProperty(childName) && swaggerChild.children[childName].requestCount > 0) {
        return this.getSingleSwaggerRequestFromFolder(swaggerChild.children[childName])
      }
    }
    console.log('For this swaggerChild, getSingleSwaggerRequestFromFolder returns null ', swaggerChild)

    return null
  },

  // converts a swagger request to a Postman Item
  convertSwaggerRequestToItem: function (swaggerData, pathItem) {
    // Properties of Item:
    var rUrl

    var rName

    var rDataMode

    var rData = []

    var rHeaders = ''

    var rPathVariables = {}

    var rMethod = pathItem.method

    var request

    var requestBodyJSON

    var item

    var thisProduces

    var thisConsumes

    var path = pathItem.path

    var tempBasePath

    var param

    var hasQueryParams = false

    var thisAuth = {}

    var rdescription

    var operation = pathItem.request

    var pathParameters = pathItem.pathParameters

    var defaultVal

    var resCode

    var requestAttr

    var baseParams = swaggerData.baseParams

    var thisParams = this.getParamsForPathItem(swaggerData, [baseParams, operation.parameters, pathParameters])

    // replace path variables {petId} with :petId
    if (path) {
      path = path.replace(/{/g, ':').replace(/}/g, '')
    }

    // auth from x-postman-meta
    if (operation[META_KEY]) {
      thisAuth.type = authMap[operation[META_KEY].currentHelper]
      thisAuth[thisAuth.type] = []
      for (requestAttr in operation[META_KEY].helperAttributes) {
        if (operation[META_KEY].helperAttributes.hasOwnProperty(requestAttr)) {
          thisAuth[thisAuth.type].push({
            key: requestAttr,
            value: operation[META_KEY].helperAttributes[requestAttr]
          })
        }
      }
    }

    // URL
    tempBasePath = swaggerData.basePath.replace(/{{/g, 'POSTMAN_VARIABLE_OPEN_DB').replace(/}}/g, 'POSTMAN_VARIABLE_CLOSE_DB')

    rUrl = decodeURI(url.resolve(tempBasePath, path))
      .replace(/POSTMAN_VARIABLE_OPEN_DB/gi, '{{')
      .replace(/POSTMAN_VARIABLE_CLOSE_DB/gi, '}}')

    // convert the request
    // >> headers
    thisProduces = operation.produces || swaggerData.globalProduces
    thisConsumes = operation.consumes || swaggerData.globalConsumes

    // auth done for type=apiKey
    _.each(operation.security, (security) => {
      for (var secReq in security) {
        if (security.hasOwnProperty(secReq)) {
          // look up global security definitions for this
          if (swaggerData.securityDefs[secReq] && swaggerData.securityDefs[secReq].type === 'apiKey') {
            thisParams.apiKey = swaggerData.securityDefs[secReq]
          }
        }
      }
    })

    // Add params to URL / body / headers
    for (param in thisParams) {
      if (thisParams.hasOwnProperty(param) && thisParams[param]) {
        // Get default value for .in = query/header/path/formData
        defaultVal = '{{' + thisParams[param].name + '}}'
        if (thisParams[param].hasOwnProperty('default')) {
          defaultVal = thisParams[param].default
        }

        // TODO: Include options support
        if (thisParams[param].in === 'query') {
          // && this.options.includeQueryParams !== false) {
          if (!hasQueryParams) {
            hasQueryParams = true
            rUrl += '?'
          }
          rUrl += thisParams[param].name + '=' + defaultVal + '&'
        } else if (thisParams[param].in === 'header') {
          rHeaders += thisParams[param].name + ': ' + defaultVal + '\n'
        } else if (thisParams[param].in === 'body') {
          rDataMode = 'raw'
          // Use schema if possible want to use swaggerData.sample definitions to resolve
          if (thisParams[param].schema) {
            thisParams[param].schema.definitions = _.assign(
              {},
              swaggerData.sampleDefinitions, // global definitions
              thisParams[param].schema.definitions // local definitions
            )
          }
          try {
            // Use modified schema faker class to create tags for the body and create a description if it exists
            jsf.option('alwaysFakeOptionals', 'true')

            if (thisParams[param].schema.$ref) {
              rData = jsf.generate(thisParams[param].schema)
              rdescription = rData.description
              delete rData.description
            }
          } catch (e) {
            rData = '// ' + JSON.stringify(thisParams[param].schema)
          }
          rHeaders += 'Content-Type: application/json\n'
        } else if (thisParams[param].in === 'formData') {
          if (thisConsumes.indexOf('application/x-www-form-urlencoded') > -1) {
            rDataMode = 'urlencoded'
          } else {
            rDataMode = 'formdata'
          }
          rData.push({
            key: thisParams[param].name,
            value: defaultVal,
            type: 'text',
            enabled: true
          })
        } else if (thisParams[param].in === 'path') {
          rPathVariables[thisParams[param].name] = defaultVal
        }
      }
    }
    if (hasQueryParams) {
      rUrl = rUrl.slice(0, -1)
    }
    // adding content-type accept headers
    if (thisProduces.length > 0) {
      rHeaders += 'Accept: ' + thisProduces.join(', ') + '\n'
    }
    if (rHeaders.indexOf('Content-Type') === -1) {
      if (thisConsumes.length > 0) {
        rHeaders += 'Content-Type: ' + thisConsumes[0] + '\n'
      }
    }
    // adding a description for all other requests, only 200 requests include descriptions that are useful in this case so they are the only one to look out for

    if (!rdescription) {
      if (rMethod == 'get') {
        if ('200' in operation['responses']) {
          var reference = operation['responses']['200']['schema'].$ref

          if (reference) {
            var inputdef = {
              // create a definitions object to parse and then put back in
              $ref: reference,
              definitions: swaggerData['sampleDefinitions']
            }

            jsf.option('alwaysFakeOptionals', 'true')
            var outdata = jsf.generate(inputdef)
            rdescription = outdata.description
          }
        }
      }
    }

    // requestName
    rName = operation.summary
    request = new Request({
      method: rMethod,
      name: rName,
      description: rdescription,
      url: rUrl,
      header: rHeaders
    })
    // adding pathparam values to url object
    request.url.variables.members.forEach((element) => {
      element.value = rPathVariables[element.key]
    })

    // adding auth to request
    request.auth = new RequestAuth(thisAuth)

    item = new Item({ name: rName })

    // request body
    requestBodyJSON = {
      mode: rDataMode
    }

    if (rDataMode === 'formdata') {
      requestBodyJSON.formdata = rData
    } else if (rDataMode === 'urlencoded') {
      requestBodyJSON.urlencoded = rData
    } else {
      requestBodyJSON.raw = JSON.stringify(rData, null, 2)
    }
    request.body = new RequestBody(requestBodyJSON)

    item.request = request

    return item
  },

  // https://swagger.io/docs/specification/2-0/paths-and-operations/
  // Swagger 2.0 only supports get, post, put, patch, delete, head, and options.
  isValidMethod: function (method) {
    return method && ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase())
  },
  validateTags: function (pathsval, tags) {
    if (tags == '') {
      return true
    }
    for (var response in pathsval) {
      if (pathsval[response].hasOwnProperty('tags')) {
        for (var tagval in pathsval[response]['tags']) {
          if (pathsval[response]['tags'][tagval] == tags) {
            return true
          }
        }
      }
    }
    return false
  },
  validateRequestTag: function (requestval, tags) {
    if (tags == '') {
      return true
    }
    if (requestval.hasOwnProperty('tags')) {
      for (var tagvals in requestval['tags']) {
        if (requestval['tags'][tagvals] == tags) {
          return true
        }
      }
    }
    return false
  },
  // Reads the path structure of the swagger spec and converts it into a tree
  getTreeFromPaths: function (json) {
    var paths = json.paths

    var path

    var tree = {
      name: '/',
      requestCount: 0,
      children: {},
      type: 'group'
    }

    var method

    var treeNode

    var thisPath

    var thisPathObject

    var thisPathCount

    var len

    var i
    // if a particular path has MORE than 1 props, make it a folder - always
    // how to detemine subfolders?
    // first, loop through each path and store request count at that path
    // then, loop throug each path again, and see which of its sub-paths have more than 1 requsts

    /**
      //store a map: path -> {requestCount, isFolder}
      eg. we hit /user which just has a get,
      we store "/user": 1
      then we see /user/username, which has a get
      we store "/user/username": 1
      Now we need to make "/user" a folder because it has a sub-path
      We loop through again. When we hit /user/username,
      we split into paths: /user. If this path doesn't exist, it's ok because it
      has no request and /user/username can be a root folder.
      If /user exists and has isFolder=false, set isFolder to true
      What do we do for multiple segments? The solution must be recursive
      NO NO NO. We create a tree-like structure
      Keep adding root nodes
      For each node that you pass, increment "count" by number of requests in the group
      For eg. /user/specs/frame has 2 requests.
      Each node can be an itemGroup OR a request
      Each node has: name, requestCount, type
      If type = request, it also has a request object
      Then we just traverse the tree and convert it into a proper structure
      The tree looks like:
      root(2) -> user(2) -> specs(2) -> frame(2)
      When we see /user with 1 request:
      root(3) -> user(3) -> specs(2) -> frame(2)
        |-> GET
      Once all paths are read, you do a recursive DFS traversal and create itemGroup structure tree
      */
    // paths.sort();
    var array = Object.entries(paths)
    array.sort()

    for (iter in array) {
      var path = array[iter][0]
      if (paths.hasOwnProperty(path) && this.validateTags(paths[path], this.options.tag)) {
        thisPathObject = paths[path]
        // thisPath will be [user, specs, frame]

        if (path[0] === '/') {
          // we don't want an empty first segment
          path = path.substring(1)
        }

        thisPath = path.split('/')
        thisPathCount = Object.keys(thisPathObject).length // =3
        len = thisPath.length

        treeNode = tree

        for (i = 0; i < len; i++) {
          if (!treeNode.children[thisPath[i]]) {
            treeNode.children[thisPath[i]] = {
              name: thisPath[i],
              requestCount: 0,
              children: {},
              requests: [],
              type: 'group'
            }
          }

          treeNode.children[thisPath[i]].requestCount += thisPathCount
          treeNode = treeNode.children[thisPath[i]]
        }

        // loop complete. Add the children here
        // add the requests as "requestChildren"
        for (method in thisPathObject) {
          if (
            thisPathObject.hasOwnProperty(method) &&
            this.isValidMethod(method) &&
            this.validateRequestTag(thisPathObject[method], this.options.tag)
          ) {
            treeNode.requests.push({
              name: method,
              method: method,
              type: 'request',
              path: path,
              request: thisPathObject[method],
              pathParameters: thisPathObject.parameters || []
            })
          }
        }
      }
    }

    return tree
  },

  // Called from the exported .validate function
  parse: function (jsonOrString) {
    var swaggerObj = jsonOrString

    if (typeof jsonOrString === 'string') {
      try {
        swaggerObj = JSON.parse(jsonOrString)
      } catch (jsonEx) {
        // Not direct JSON. Could be YAML
        try {
          swaggerObj = yaml.safeLoad(jsonOrString)
        } catch (yamlEx) {
          // Not JSON or YAML
          return {
            result: false,
            reason: 'The input must be valid JSON or YAML'
          }
        }
        // valid YAML
      }
    }

    // valid JSON

    // Check for everything that's required according to
    // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md
    if (swaggerObj.swagger !== '2.0') {
      return {
        result: false,
        reason: 'The Swagger object must have the "swagger" property set to 2.0'
      }
    }
    if (!swaggerObj.info) {
      return {
        result: false,
        reason: 'The Swagger object must have an "info" property'
      }
    }
    if (!(swaggerObj.info.title && swaggerObj.info.version)) {
      return {
        result: false,
        reason: 'The info property must have title and version defined'
      }
    }
    if (!swaggerObj.paths) {
      return {
        result: false,
        reason: 'The Swagger object must have a "paths" property'
      }
    }

    // Valid. No reason needed
    return {
      result: true,
      swagger: swaggerObj
    }
  }
}
