/**
* Singleton pour Node.js
*
* @author Michael Thomas
**/

var pool = {}, provider = {}, path = require('path');
provider.get = function(moduleName, isGlobal, pathTo)
{
	if ('boolean' !== typeof isGlobal)
		throw new TypeError('isGlobal must be an boolean indicating if the module is or not local: modules in "node_modules" are considered as global');
	var toReq = false === isGlobal ? 'node_modules' === pathTo ? path.join(pathTo, moduleName) : moduleName : moduleName;
	if ( !pathTo)
		pathTo = __dirname;
	else
		pathTo = path.resolve(pathTo);
	return pool[moduleName] || pool[toReq];
};

module.exports = provider;