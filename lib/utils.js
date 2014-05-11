/**
* Function useful to know what is the real type of an object.
* 
* @param obj
*          {Object}: The Object for which one you want to identify the type
**/
function realTypeOf(obj)
{
	try
	{
		return Object.prototype.toString.apply(obj).substring(8, val.indexOf(']')); // Transform "[object typeName]" in "typeName"
	}
	catch (e)
	{
		console.error(e);
		return 'Undefined';
	}
};

/**
* A function useful to check if the element in entry is: empty, <code>null</code> or <code>undefined</code>
* 
* @param value
* 			 {String} || {Object}: The element to check
* @returns {Boolean}: The value indicate if the input element is empty or not.
**/
function isDefined(value)
{
	try
	{
		if ('Object' === realTypeOf(value))
			if (0 === Object.keys(value).length)
				return false;
	}
	catch (e)
	{
		return false;
	}
	return !('String' === realTypeOf(value) && '' === value || 'Null' === realTypeOf(value) || 'Undefined' === realTypeOf(value));
};

/**
* A function useful to check if the element in entry is an integer
* 
* @param value
* 			 {Number} || {Object}: The element to check
* @returns {Boolean}: The value indicate if the input element is an integer or not.
**/
function isInt(val)
{
	return parseFloat(val) === parseInt(val) && !isNaN(parseInt(val));
};

/**
* A function useful to check if the element in entry is an integer
* 
* @param value
* 			 {Number} || {Object}: The element to check
* @returns {Boolean}: The value indicate if the input element is an integer or not.
**/
function isFloat(val)
{
	return isDefined(parseFloat(val)) && !isNaN(parseFloat(val));
};

/**
* A function useful to know if the parameter <code>obj</code> is well of the type passed as string in <code>typeName</code> argument.
* 
* @param obj {Object} : The object to test
* @param typeName {String} : The string giving the exact name of the type wanted for the object (not case sensitive)
* @return {boolean} <code>true</code> if the type are in agreement with the <code>typeName</code> argument, <code>else</code> otherwise. But the function will break if  <code>typeName</code> argument is not a String !
**/
function typeVerificator(obj, typeName)
{
	if ('String' === realTypeOf(typeName))
		return typeName.toLowerCase() === realTypeOf(obj).toLowerCase();
	else
		throw new TypeError('typeName must be a String !');
};

/**
* Function to know if the Local Storage is defined for this browser 
* 
* @returns {Boolean} <code>true</code> if the LS is defined, <code>false</code> else
**/
function LSDefinied()
{
	var res;
	try
	{
		res = typeof localStorage != 'undefined'
	}
	catch (e)
	{
		res = false;
	}
	// localStorage test can throw error when cookies are blocked on Firefox
	return res;
}

// /!\ 'setItemToLS' & 'setItemToSS' nécessitent une librairie JSON. JSON3 est recommandé, et disponible ici: http://bestiejs.github.io/json3/lib/json3.min.js
/**
* Function to call to get Local Storage element(s).
*
* @see <a href='http://www.w3.org/TR/webstorage/#the-localstorage-attribute'>W3C doc for Local Storage</a>
*
* @param name {String} || {Array&lt;String&gt;} : a string or an array of string which contains the Local Storage's name(s) to get
* @returns {String} || {Array&lt;String&gt;} a string or an array of string containing the string stored in the Local Storage. If the item <code>name</code> does not exists in the Local Storage, the result will be <code>null</code>.
**/
function getItemFromLS(name)
{
	var LSResult = new Array(), isString = realTypeOf(name) == 'String';
	if (realTypeOf(name) == 'Array')
		for (var i = 0; i < name.length; i++)
		{
			if (realTypeOf(name[i]) != 'String')
				name[i] = name[i].toString();
			LSResult[i] = localStorage.getItem(name[i]);
		}
	else if (isString == true)
		LSResult[0] = localStorage.getItem(name);

	if (LSResult.length == 1)
		return LSResult[0];
	else
		return LSResult;
}

/**
* Function to set element(s) to the Local Storage.
*
* @see <a href='http://www.w3.org/TR/webstorage/#the-localstorage-attribute'>W3C doc for Local Storage</a>
*
* @param name {String} || {Array&lt;String&gt;} : a string or an array of string which contains the Local Storage's name(s) to set
* @param val {String} : the value to put in its element.
**/
function setItemToLS(name, val, isJSON)
{
	if (realTypeOf(isJSON) == 'Boolean')
	{
		if (realTypeOf(name) == 'Array' && realTypeOf(val) == 'Array' && val.length == name.length)
			for (var i = 0; i < name.length; i++)
			{
				if (null === val[i])
					val[i] = '';
				else if (realTypeOf(val[i]) != 'String')
					val[i] = val[i].toString();
				if (realTypeOf(name[i]) != 'String')
					name[i] = name[i].toString();
				if (isJSON === true)
					val[i] = JSON.stringify(val[i]);
				localStorage.setItem(name[i], val[i]);
			}
		else if (realTypeOf(name) == 'Array' && realTypeOf(name[0]) == 'String' && realTypeOf(val) == 'String')
		{
			if (null === val)
				val = '';
			if (isJSON === true)
				val = JSON.stringify(val);

			for (var i = 0; i < name.length; i++)
			{
				if (realTypeOf(name[i]) != 'String')
					name[i] = name[i].toString();

				localStorage.setItem(name[i], val);
			}
		}
		else if (realTypeOf(val) == 'String' && realTypeOf(name) == 'String')
		{
			if (null === val)
				val = '';
			localStorage.setItem(name, val);
		}
		else
			throw new Error();
	}
	else
		throw new TypeError('iJSON argument must be a boolean indicating if val is or not a JSON String');
}

/**
* Function to call to remove Local Storage element(s).
*
* @see <a href='http://www.w3.org/TR/webstorage/#the-localstorage-attribute'>W3C doc for Local Storage</a>
*
* @param name {String} || {Array&lt;String&gt;} : a string or an array of string which contains the Local Storage's name(s) to remove
**/
function removeItemFromLS(name)
{
	var isString = realTypeOf(name) == 'String';
	if (realTypeOf(name) == 'Array')
		for (var i = 0; i < name.length; i++)
		{
			if (realTypeOf(name[i]) != 'String')
				name[i] = name[i].toString();
			localStorage.removeItem(name[i]);
		}
	else if (isString == true)
		localStorage.removeItem(name);
	else
		throw new TypeError('name argument must be a string or an array of string');
}

/**
* Function to call to get Session Storage element(s).
*
* @see <a href='http://www.w3.org/TR/webstorage/#the-sessionstorage-attribute'>W3C doc for Session Storage</a>
*
* @param name {String} || {Array&lt;String&gt;} : a string or an array of string which contains the Session Storage's name(s) to get
* @returns {String} || {Array&lt;String&gt;} a string or an array of string containing the string stored in the Session Storage. If the item <code>name</code> does not exists in the Local Storage, the result will be <code>null</code>.
**/
function getItemFromSS(name)
{
	var LSResult = new Array(), isString = realTypeOf(name) == 'String';
	if (realTypeOf(name) == 'Array')
	{
		for (var i = 0; i < name.length; i++)
			if (realTypeOf(name[i]) == 'String')
				isString = true;
		for (var i = 0; i < name.length; i++)
			LSResult[i] = sessionStorage.getItem(name[i]);
	}
	else if (isString == true)
		LSResult[0] = sessionStorage.getItem(name);
	else
	{
		console.log('Le type envoyé pour le paramètre d\'entrée n\'est pas correct !');
		return;
	}
	if (LSResult.length == 1)
		return LSResult[0];
	else
		return LSResult;
}

/**
* Function to set element(s) to the Session Storage.
*
* @see <a href='http://www.w3.org/TR/webstorage/#the-sessionstorage-attribute'>W3C doc for Session Storage</a>
*
* @param name {String} || {Array&lt;String&gt;} : a string or an array of string which contains the Session Storage's name(s) to set
* @param val {String} : the value to put in its element.
**/
function setItemToSS(name, val, isJSON)
{
	if (realTypeOf(isJSON) == 'Boolean')
	{
		if (realTypeOf(name) == 'Array' && realTypeOf(val) == 'Array' && val.length == name.length)
			for (var i = 0; i < name.length; i++)
			{
				if (null === val[i])
					val[i] = '';
				else if (realTypeOf(val[i]) != 'String')
					val[i] = val[i].toString();
				if (realTypeOf(name[i]) != 'String')
					name[i] = name[i].toString();
				if (isJSON === true)
					val[i] = JSON.stringify(val[i]);
				sessionStorage.setItem(name[i], val[i]);
			}
		else if (realTypeOf(name) == 'Array' && realTypeOf(name[0]) == 'String' && realTypeOf(val) == 'String')
		{
			if (null === val)
				val = '';
			if (isJSON === true)
				val = JSON.stringify(val);

			for (var i = 0; i < name.length; i++)
			{
				if (realTypeOf(name[i]) != 'String')
					name[i] = name[i].toString();

				sessionStorage.setItem(name[i], val);
			}
		}
		else if (realTypeOf(val) == 'String' && realTypeOf(name) == 'String')
		{
			if (null === val)
				val = '';
			sessionStorage.setItem(name, val);
		}
		else
			throw new Error();
	}
	else
		throw new TypeError('isJson argument must be a boolean indicating if val argument is or not a JSON string');
}

/**
* Function to call to remove Session Storage element(s).
*
* @see <a href='http://www.w3.org/TR/webstorage/#the-sessionstorage-attribute'>W3C doc for Session Storage</a>
*
* @param name {String} || {Array&lt;String&gt;} : a string or an array of string which contains the Session Storage's name(s) to remove
**/
function removeItemFromSS(name)
{
	var isString = realTypeOf(name) == 'String';
	if (realTypeOf(name) == 'Array')
		for (var i = 0; i < name.length; i++)
		{
			if (realTypeOf(name[i]) != 'String')
				name[i] = name[i].toString();
			sessionStorage.removeItem(name[i]);
		}
	else if (isString == true)
		sessionStorage.removeItem(name);
	else
		throw new TypeError('name argument must be a string, or an array of string !');
}

/**
*
* Function to translate a day number into its french day name
*
* @param int {Number} : an int between 1 & 7 which indicate a day of a week
* @returns {String} the french day name
**/
function getFrDayName(int)
{
	if ( !isInt(int))
		throw new TypeError('The arguement must be an integer between 1 and 7');
	switch (int)
	{
		case 1:
			return 'Lundi';
		case 2:
			return 'Mardi';
		case 3:
			return 'Mercredi';
		case 4:
			return 'Jeudi';
		case 5:
			return 'Vendredi';
		case 6:
			return 'Samedi';
		case 7:
			return 'Dimanche';
		default:
			throw new RangeError('The value must be in the specified range: [1-7]');
	}
}

/**
*
* Function to parse a date (time) into a String with French Notation, with milliseconds
*
* @param date {Date} || <b>null</b> : the date to parse, or null to get the "now" datetime parsed
* @returns {String} the parsed date
**/
function stringifyDateFr(date)
{
	if (null === date)
	{
		date = new Date();
		return getFrDayName(date.getDay()) + ' ' + (date.getDate() < 10 ? '0' + date.getDate().toString() : date.getDate().toString()) + '-' + (date.getMonth() < 10 ? '0' + date.getMonth().toString() : date.getMonth().toString()) + '-' + date.getFullYear().toString() + ' ' + (date.getHours() < 10 ? '0' + date.getHours().toString() : date.getHours().toString()) + ':'
				+ (date.getMinutes() < 10 ? '0' + date.getMinutes().toString() : date.getMinutes().toString()) + ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds().toString() : date.getSeconds().toString()) + ':'
				+ (date.getMilliseconds() < 10 ? '00' + date.getMilliseconds().toString() : date.getMilliseconds() < 100 ? '00' + date.getMilliseconds().toString() : date.getMilliseconds().toString());
	}
	else if (realTypeOf(date) == 'Date')
		return getFrDayName(date.getDay()) + ' ' + (date.getDate() < 10 ? '0' + date.getDate().toString() : date.getDate().toString()) + '-' + (date.getMonth() < 10 ? '0' + date.getMonth().toString() : date.getMonth().toString()) + '-' + date.getFullYear().toString() + ' ' + (date.getHours() < 10 ? '0' + date.getHours().toString() : date.getHours().toString()) + ':'
				+ (date.getMinutes() < 10 ? '0' + date.getMinutes().toString() : date.getMinutes().toString()) + ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds().toString() : date.getSeconds().toString()) + ':'
				+ (date.getMilliseconds() < 10 ? '00' + date.getMilliseconds().toString() : date.getMilliseconds() < 100 ? '00' + date.getMilliseconds().toString() : date.getMilliseconds().toString());
	else
		throw new TypeError('The argument must be a Date, or set to null');
}

/**
* the function used to visit each node of a DOM organized document (like XML and/or HTML).
* 
* @param parentNode :
* 					the "master" node from which you start the children's visit
**/
function visitRecursively(actual)
{
	// get all child nodes
	var children = actual.children;
	// execute action on actual node
	execute(actual);

	for (var i = 0; i < children.length; i++)
		// visit child node
		visitRecursively(children[i])
}

function execute(node)
{
// TODO: Put your execution code here.
}

/**
* A function that return a boolean indicating if the user browser if IE <= 8.
* 
* @returns {Boolean} : <code>true</code> if the browser is IE 9 or older version, or another browser; <code>false</code> otherwise  
**/
function isIE9Plus()
{
	var myNav = navigator.userAgent.toLowerCase();
	return -1 === myNav.indexOf('msie') ? true : 8 > parseInt(myNav.split('msie')[1]) ? false : true; // if
};

/**
* Function to use for searching if a particular node has or not a parent node named by the given value.
* 
* @param startingNode
* 					{Node} : the node for which one you need to know if it has a parent of the searched type.
* @param parentNodeName
* 					  {String} : the name of the parent element to search.
* @return {Boolean} : a <code>boolean</code> which indicate if yes or no the starting node has a parent named by the value given in <code>parentNodeName</code>
**/
function hasSpecifiedNodeParent(startingNode, parentNodeName)
{
	var node;
	if ( !isDefined(parentNodeName))
		return false;
	if ('String' !== realTypeOf(parentNodeName))
		throw new TypeError('parentNodeName argument must be a non-empty string !');
	do
		if (parentNodeName.toLowerCase() !== node.nodeName.toLowerCase())
			node = node.parentNode;
	while (null !== node && node.nodeName.toLowerCase() !== parentNodeName);
	return null !== node;
}

var utils =
{
	realTypeOf : realTypeOf,
	isDefined : isDefined,
	isInt : isInt,
	typeVerificator : typeVerificator,
	LSDefinied : LSDefinied,
	getItemFromLS : getItemFromLS,
	setItemToLS : setItemToLS,
	removeItemFromLS : removeItemFromLS,
	getItemFromSS : getItemFromSS,
	setItemToSS : setItemToSS,
	removeItemFromSS : removeItemFromSS,
	getFrDayName : getFrDayName,
	stringifyDateFr : stringifyDateFr,
	isIE9Plus : isIE9Plus,
	hasSpecifiedNodeParent : hasSpecifiedNodeParent
}

if (isDefined(require) && isDefined(module) && isDefined(module.exports))
	module.exports = utils;