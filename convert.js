var Collection = require('postman-collection').Collection,
    ItemGroup = require('postman-collection').ItemGroup,
    Item = require('postman-collection').Item,
    Request = require('postman-collection').Request,
    url = require('url'),
    META_KEY = 'x-postman-meta',
    Utils = 
    Converter = null;

Converter = {
	// Static Props:
	collection: null, // will hold the V2 collection object

	basePath: null, //swagger.basePath. Represents the API Host

	// sets collection basePath according to swagger basePath and schemes
	setBasePath: function (json) {
        this.basePath = '';
        if (json.host) {
            this.basePath = json.host;
        }
        if (json.basePath) {
            this.basePath += json.basePath;
        }

        if (json.schemes && json.schemes.indexOf('https') != -1) {
            this.basePath = 'https://' + this.basePath;
        }
        else {
            this.basePath = 'http://' + this.basePath;
        }

        if (!this.basePath.endsWith('/')) {
            this.basePath += '/';
        }
    },

    setCollectionMetadata: function (json) {
        this.collection.name = json.info.title;
        this.collection.describe(json.info.description);
    },

    initializeCollection: function() {
    	this.collection = new Collection();
    },


	/**
	 Validates basic swagger2 properties
	 Returns a validation object: {result, reason}
	*/
	validate: function (json) {
		var status = true;

        if (!json.hasOwnProperty('swagger') || json.swagger !== '2.0') {
            return {
            	result: false,
            	reason: 'Must contain a swagger field (2.0)'
            };
        }

        if (!json.hasOwnProperty('info')) {
        	return {
            	result: false,
            	reason: 'Must contain an info object'
            };
        }
        else {
            var info = json.info;
            if (!info || !info.title) {
            	return {
	            	result: false,
	            	reason: 'Must contain info.title'
	            };
            }
        }

        return {
        	result: true
        }
    },

    // Sets global parameters for use in child requests
    handleParams: function (params) {
        for (var param in params) {
            if (params.hasOwnProperty(param)) {
                this.logger('Adding collection param: ' + param);
                this.baseParams[param] = params[param];
            }
        }
	},

	// Reads the path structure of the swagger spec and converts it into a tree
	evaluatePaths: function (json) {
        var paths = json.paths,
            path,
            folderName,
            tree = {
                name: '/',
                requestCount: 0,
                children: {},
                type: 'group',
            },
            treeNode,
            thisPath,
            thisPathObject,
            thisPathCount,
            len,
            i;

        //if a particular path has MORE than 1 props, make it a folder - always
        //how to detemine subfolders?
        //first, loop through each path and store request count at that path
        //then, loop throug each path again, and see which of its sub-paths have more than 1 requsts

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

        for (var path in paths) {
            if (paths.hasOwnProperty(path)) {
                thisPathObject = paths[path];
                //thisPath will be [user, specs, frame]

                if (path[0] == "/") {
                    // we don't want an empty first segment
                    path=path.substring(1);
                }

                thisPath = path.split("/");
                thisPathCount = Object.keys(thisPathObject).length; // =3
                len = thisPath.length;

                treeNode = tree;

                for(i=0; i<len; i++) {
                    if(!treeNode.children[thisPath[i]]) {
                        treeNode.children[thisPath[i]] = {
                            name: thisPath[i],
                            requestCount: 0,
                            children: {},
                            requests: [],
                            type: 'group',
                        }
                    }

                    treeNode.children[thisPath[i]].requestCount += thisPathCount;
                    treeNode = treeNode.children[thisPath[i]];
                }

                // loop complete. Add the children here
                // add the requests as "requestChildren"
                for (var method in thisPathObject) {
                    if (thisPathObject.hasOwnProperty(method)) {
                        treeNode.requests.push({
                            name: method,
                            method: method,
                            type: 'request',
                            path: path,
                            request: thisPathObject[method]
                        });
                    }
                }

            }
        }
        return tree;
    },

    // 
    convertChildToItemGroup: function(child) {
        var thisItemGroup, thisItem, rCount;
        // child will be a folder or request
        // depending on the type
        var a = Math.floor(Math.random() * 1000);
        // console.log(a + ': Converting child of type: ', child);

        if (child.type === "group") {
            // folder
            thisItemGroup = new ItemGroup({
                name: child.name
            });
            for(var subChild in child.children) {
                if(child.children.hasOwnProperty(subChild)) {
                    thisItemGroup.items.add(
                    	this.convertChildToItemGroup(child.children[subChild])
                	);
                }
            }
            for(var i = 0, rCount = child.requests.length; i < rCount; i++) {
                thisItemGroup.items.add(this.convertChildToItemGroup(child.requests[i]));
            }
            return thisItemGroup;
        }
        else {
            // request
            thisItem = this.convertSwaggerRequestToItem(child)
            // console.log(a + ': Returned item: ', JSON.stringify(thisItem));
            return thisItem;
        }
    },

    // converts a swagger request to a Postman Item
    convertSwaggerRequestToItem: function (pathItem) {
    	// Properties of Item:
    	var name = pathItem.name,
            rUrl,
            rName,
            rDescription,
            rDataMode,
            rData = [],
            rHeaders = '',
            rPathVariables,
            rMethod = pathItem.method,
            responses,
    		thisProduces, thisConsumes,
    		path = pathItem.path,
    		tempBasePath,
    		hasQueryParams = false,
    		operation = pathItem.request,
    		thisParams = this.getParamsForPathItem(this.baseParams, operation.parameters);

		// replace path variables {petId} with :petId
        if (path) {
            path = path.replace(/{/g, ':').replace(/}/g, '');
        }

        // if (operation[META_KEY]) {
        //     for (requestAttr in operation[META_KEY]) {
        //         if (operation[META_KEY].hasOwnProperty(requestAttr)) {
        //         	// TODO: Save these in auth?
        //             request[requestAttr] = operation[META_KEY][requestAttr];
        //         }
        //     }
        // }


        // URL
        tempBasePath = this.basePath
	        .replace(/{{/g, 'POSTMAN_VARIABLE_OPEN_DB')
	        .replace(/}}/g, 'POSTMAN_VARIABLE_CLOSE_DB');

	    rUrl = decodeURI(url.resolve(tempBasePath, path))
	        .replace(/POSTMAN_VARIABLE_OPEN_DB/gi, '{{')
	        .replace(/POSTMAN_VARIABLE_CLOSE_DB/gi, '}}');
        console.log('Set request URL: ', rUrl);

    	rName = operation.summary;


		// convert the request
		// >> headers
		thisProduces = operation.produces || this.globalProduces;
		thisConsumes = operation.consumes || this.globalConsumes;
        
        if (thisProduces.length > 0) {
            rHeaders += 'Accept: ' + thisProduces.join(', ') + '\n';
        }
        if (thisConsumes.length > 0) {
            rHeaders += 'Content-Type: ' + thisConsumes[0] + '\n';
        }


		for (param in thisParams) {
            if (thisParams.hasOwnProperty(param) && thisParams[param]) {

                // Get default value for .in = query/header/path/formData
                defaultVal = '{{' + thisParams[param].name + '}}';
                if (thisParams[param].hasOwnProperty('default')) {
                    defaultVal = thisParams[param].default;
                }

                // TODO: Include options support
                if (thisParams[param].in === 'query') { // && this.options.includeQueryParams !== false) {
                    if (!hasQueryParams) {
                        hasQueryParams = true;
                        rUrl += '?';
                    }
                    rUrl += thisParams[param].name + '=' + defaultVal + '&';
                }

                else if (thisParams[param].in === 'header') {
                    rHeaders += thisParams[param].name + ': ' + defaultVal + '\n';
                }

                else if (thisParams[param].in === 'body') {
                    rDataMode = 'raw';
                    rData = thisParams[param].description;
                }

                else if (thisParams[param].in === 'formData') {
                    if (thisConsumes.indexOf('application/x-www-form-urlencoded') > -1) {
                        rDataMode = 'urlencoded';
                    }
                    else {
                        rDataMode = 'params';
                    }
                    rData.push({
                        'key': thisParams[param].name,
                        'value': defaultVal,
                        'type': 'text',
                        'enabled': true
                    });
                }
                else if (thisParams[param].in === 'path') {
                    if (!rPathVariables) {
                        rPathVariables = {};
                    }
                    rPathVariables[thisParams[param].name] = defaultVal;
                }
            }
        }

        var request = new Request({
            method: rMethod,
            name: rName,
            url: rUrl,
            header: rHeaders
        }),
        item = new Item({name: rName});
        item.request = request;
        console.log('Generated V1 request: ', request);

        return item;
    },

    // Combines all params for a swagger path
    // Headers / body / path etc.
    // newParams is from swagger
    // oldParams id the ode
    getParamsForPathItem: function (oldParams, newParams) {
        var retVal = {},
            numOldParams,
            numNewParams,
            i,
            parts,
            lastPart,
            getBaseParam;

        oldParams = oldParams || [];
        newParams = newParams || [];

        numOldParams = oldParams.length;
        numNewParams = newParams.length;

        for (i = 0; i < numOldParams; i++) {
            if (oldParams[i].$ref) {
                // this is a ref
                if (oldParams[i].$ref.indexOf('#/parameters') === 0) {
                    parts = oldParams[i].$ref.split('/');
                    lastPart = parts[parts.length - 1];
                    getBaseParam = this.baseParams[lastPart];
                    retVal[lastPart] = getBaseParam;
                }
            }
            else {
                retVal[oldParams[i].name] = oldParams[i];
            }
        }

        for (i = 0; i < numNewParams; i++) {
            if (newParams[i].$ref) {
                // this is a ref
                if (newParams[i].$ref.indexOf('#/parameters') === 0) {
                    parts = newParams[i].$ref.split('/');
                    lastPart = parts[parts.length - 1];
                    getBaseParam = this.baseParams[lastPart];
                    retVal[lastPart] = getBaseParam;
                }
            }
            else {
                retVal[newParams[i].name] = newParams[i];
            }
        }

        return retVal;
    },

    createCollectionStructure: function (tree) {
    	// this takes in the tree structure, and creates the collection struct
    	// with folders and params and requests

    	// Add each of the root children to the collection items
        for (var child in tree.children) {
            if (tree.children.hasOwnProperty(child)) {
                this.collection.items.add(
                	this.convertChildToItemGroup(tree.children[child])
            	);
            }
        }
    },

    // takes in a swagger2 JSON object
    // returns a V2 collection JSON object
	convert: function (json) {
		// No validation needed. If the app didn't call validate, this will throw an error
		var result = {
			status: true,
			collecion: null,
			reason: null
		};
		// TODO: Document these
		// Set schema-wide input and output formats
		this.globalConsumes = json.consumes || [];
        this.globalProduces = json.produces || [];

        // Read global properties from the JSON:
        this.setBasePath(json);
        this.handleParams(json.parameters);

        // Start building out collection:
        this.initializeCollection();
        this.setCollectionMetadata(json);

        var tree = this.evaluatePaths(json);

        this.createCollectionStructure(tree);

        result.collection = this.collection.toJSON();
        return result;
	}
};

module.exports = {
	convert: function (json) {
        return Converter.convert(json);
    }
}