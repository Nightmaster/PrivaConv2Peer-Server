/*!
* @author Gaël B.
!*/
var fs = require('fs'), // File System library
	mysql = require('mysql'), // MySQL connection module
	util = require('util'), // Native util module
	hasher = require('../lib/password').saltAndHash, // saltAndHash for passwords
	rsa = require('../lib/genRSA').genRSA, // RSA Key generator module
	utils = require('../lib/utils'), // Personnal utils module
	infos = require('../config').MySQLInformations, // Retrieve informations stored in the config file
	connection = mysql.createConnection(infos);

function register(req, res)
{
	var login = req.query.username, email = req.query.email, fName = req.query.firstname, lName = req.query.name, hashPw = req.query.pw, hashPwK = req.query.pwK, lengthKey = req.query.length, query;
	if (undefined === login || undefined === email || undefined === hashPw || undefined === lName || undefined === fName || undefined === hashPwK || undefined === lengthKey)
		sendJsonError(res, 400, 'Bad request. Missing parameters', 'register', 'username && email && pw && firstname && name && pw && pwK && length');
	else
	{
		hashPw = hasher(hashPw);
		query = 'Insert Into user (nom, prenom, login, display_login, email, hash_pw)\nValues ("' + lName + '", "' + fName + '", "' + login.toLowerCase() + '", "' + login + '", "' + email + '", "' + hashPw + '");';
		connection.query(query, function(err, rows, fields)
		{
			if (err)
			{
				err = err.message.split('\n')[0].split(':');
				var duplication;
				if ( -1 !== err[1].indexOf('Duplicate'))
				{
					duplication = err[1].substr(1);
					if (login === duplication.split(' ')[2].replace(/\'/g, ''))
						sendJsonError(res, 400, 'Ce nom d\'utilisateur existe déjà. Veillez en choisir un autre.', 'register');
					else if (email === duplication.split(' ')[2].replace(/\'/g, ''))
						sendJsonError(res, 400, 'Cet email est déjà utilisé par un autre utilisateur. Veillez en choisir un autre.', 'register');
				}
				else
					sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'register');
			}
			else
				res.json(
				{
					error : false,
					validation : true
				});
			rsa(hashPwK, lengthKey, login);
		});
	}
}

function connect(req, res)
{
	var login = req.query.username, email = req.query.email, hashPW = req.query.pw, query = 'Select hash_pw\nFrom user\nWhere %s = "%s";', connecQuery, uuid = res.cookies.sessId, expiration = res.cookies.expiration;
	if (undefined === login && undefined === email || undefined === hashPW)
		sendJsonError(res, 400, 'Bad request. Missing parameters', 'login', '(username || email) && pw');
	else
	{
		hashPW = hasher(hashPW);
		connecQuery = util.format('Update user\nSet user_ip = "' + req.ip + '", user_connected = 1\nWhere %s="%s";', undefined !== login ? 'login' : 'email', undefined !== login ? login.toLowerCase() : email);
		if (login)
		{
			query = util.format(query, 'login', login.toLowerCase());
			connection.query(query, function(err, rows, fields)
			{
				if (0 < rows.length)
				{
					if (hashPW === rows[0].hash_pw)
					{
						eraseOldCookie(login, 'login');
						createCookieInDB(req, res, uuid, expiration, login.toLowerCase());
						connection.query(connecQuery, function(err, rows, field)
						{
							if (err)
								console.error(err);
						});
					}
					else
						sendJsonError(res, 401, 'Mot de passe incorrect', 'connection');
				}
				else if (rows.length === 0)
					sendJsonError(res, 401, 'L\'identifiant utilisateur fourni n\'existe pas dans la base de données', 'connection');
				else
					sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'connection');
			});
		}
		else if (email)
		{
			query = util.format(query, 'email', email);
			connection.query(query, function(err, rows, fields)
			{
				if (0 < rows.length)
					if (hashPW === rows[0].hash_pw)
					{
						eraseOldCookie(email);
						createCookieInDB(req, res, uuid, expiration, email);
						connection.query(connecQuery, function(err, rows, field)
						{
							if (err)
								console.error(err);
						});
					}
					else
						sendJsonError(res, 401, 'Mot de passe incorrect', 'connection');
				else if (rows.length === 0)
					sendJsonError(res, 401, 'L\'adresse email fournie n\'existe pas dans la base de données', 'connection');
				else
				{
					console.error(err);
					sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'connection');
				}
			});
		}
	}
}

function disconnect(req, res)
{
	var callback, uuid = res.cookies.sessId, queryDel = 'Delete From cookie\nWhere value="' + uuid + '";', queryDisco = 'Update user\nSet user_ip = "", user_connected = 0\nWhere id In \n(\n\tSelect user_id\n\tFrom cookie\n\tWhere value = "' + uuid + '"\n);';
	callback = function(err, result)
	{
		if (err)
			sendJsonError(res, 500, JSON.stringify(err), 'disctonnect');
		else if (true === result)
			connection.query(queryDel, function(err, rows, fields)
			{
				if (err)
					sendJsonError(res, 500, JSON.stringify(err), 'disctonnect');
				else
					connection.query(queryDel, function(err, rows, fields)
					{
						if (err)
							sendJsonError(res, 500, JSON.stringify(err), 'disctonnect');
						else
							res.json(
							{
								error : false,
								disconnect : true
							});
					});
			});
		else
			sendJsonError(res, 401, 'Unauthorized', 'disctonnect');
	}
	checkValidityForUser(callback, uuid);
}

function modifyProfile(req, res)
{
	var uuid = res.cookies.sessId, displayLogin = req.query.username, login = undefined !== displayLogin ? displayLogin.toLowercase() : undefined, email = req.query.email, fName = req.query.firstname, lName = req.query.name, hashPW = req.query.pw, values = '', query, jsonReturned =
	{
		error : false,
		modification : true,
		newValues : {}
	}, callback;
	callback = function(err, result)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'modify Profile');
		}
		else if (true === result)
		{
			if (login)
			{
				values += 'login = "' + login + '", display_login = "' + displayLogin + '"';
				jsonReturned.newValues.login = displayLogin;
			}
			if (email)
			{
				values += '' === values ? 'email = "' + email + '"' : ', email = "' + email + '"';
				jsonReturned.newValues.email = email;
			}
			if (fName)
			{
				values += '' === values ? 'prenom = "' + fName + '"' : ', prenom = "' + fName + '"';
				jsonReturned.newValues.firstname = fName;
			}
			if (lName)
			{
				values += '' === values ? 'nom = "' + lName + '"' : ', nom = "' + lName + '"';
				jsonReturned.newValues.name = lName;
			}
			if (hashPW)
			{
				hashPW = hasher(hashPW);
				values += '' === values ? 'hash_pw = "' + hashPW + '"' : ', hash_pw = "' + hashPW + '"';
				jsonReturned.pwChanged = true;
			}
			if ('' !== values)
			{
				query = 'Update user\nSet ' + values + '\nWhere id In\n(\n\tSelect user_id\n\tFrom cookie\n\tWhere value = "' + res.cookies.sessId + '"\n);';
				connection.query(query, function(err, rows, fields)
				{
					if (err)
					{
						err = err.message.split('\n')[0].split(':');
						var duplication;
						if ( -1 !== err[1].indexOf('Duplicate'))
						{
							duplication = err[1].substr(1);
							if (login === duplication.split(' ')[2].replace(/\'/g, ''))
								sendJsonError(res, 400, 'Ce nom d\'utilisateur existe déjà. Veillez en choisir un autre.', 'modify Profile');
							else if (email === duplication.split(' ')[2].replace(/\'/g, ''))
								sendJsonError(res, 400, 'Cet email est déjà utilisé par un autre utilisateur. Veillez en choisir un autre.', 'modify Profile');
						}
						else
						{
							console.error(err);
							sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'modify Profile');
						}
					}
					else
						res.json(200, jsonReturned);
				});
			}
		}
		else
		{
			console.error(err);
			sendJsonError(res, 401, 'Unauthorized', 'modify Profile');
		}
	}
	if (undefined === login && undefined === email && undefined === fName && undefined === lName && undefined === hashPW)
		sendJsonError(res, 400, 'Bad request. Missing parameters', 'modify Profile', 'username || email || firstname || name || pw');
	else
		checkValidityForUser(callback, uuid);
}

function getKey(req, res)
{
	var callback, uuid = res.cookies.sessId, login = req.params.user.toLowerCase(), pathTo = '/PrivaConv2Peer/' + login + '/id_rsa.pem';
	callback = function(err, result)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'private Key');
		}
		else if (true === result)
			fs.readFile(pathTo, 'utf-8', function(err, file)
			{
				res.json(
				{
					error : false,
					prKey : file
				});
			});
		else
			sendJsonError(res, 401, 'Unauthorized', 'private Key');
	};
	if (undefined === login)
		sendJsonError(res, 400, 'Bad request. Missing parameter', 'private Key', 'username');
	else
		checkValidityForUser(callback, uuid, login);
}

function getPubKey(req, res)
{
	var callback, uuid = res.cookies.sessId, login = req.params.user.toLowerCase(), pathTo = '/PrivaConv2Peer/' + login + '/id_rsa.pub';
	callback = function(err, result)
	{
		function callbackFriendList(err, result)
		{
			if (err)
				sendJsonError(res, 500, JSON.stringify(err), 'public Key');
			else if ( -1 !== result.indexOf(login))
				fs.readFile(pathTo, 'utf-8', function(err, file)
				{
					res.json(
					{
						error : false,
						user :
						{
							username : login,
							pubKey : file
						}
					});
				});
			else
				sendJsonError(res, 401, 'Vous n\'êtes pas ami avec cette personne, ou il n\a pas encore accepté votre demande !', 'public Key')
		}
		if (err)
			sendJsonError(res, 500, JSON.stringify(err), 'public Key');
		else if (true === result)
			getSimpleFriendList(callbackFriendList, uuid);
		else
			sendJsonError(res, 401, 'Unauthorized', 'public Key');
	};
	if (undefined === login || null === login)
		sendJsonError(res, 400, 'Bad request. Missing parameter', undefined, 'username');
	else
		checkValidityForUser(callback, uuid);
}

function getCliIP(req, res)
{
	var callback, uuid = res.cookies.sessId, user = req.params.user, query = 'Select user_ip From user Where login = ' + user.toLowerCase();
	callback = function(err, result)
	{
		function callbackFl(err, result)
		{
			if (err)
			{
				console.error(err);
				sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'get IP');
			}
			else if ( -1 !== result.indexOf(user))
				connection.query(query, function(err, rows, fields)
				{
					if (err)
					{
						console.error(err);
						sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'get IP');
					}
					else if (rows && 0 !== rows.length)
						res.json(
						{
							error : false,
							ip : rows[0].user_ip
						});
					else
						sendJsonError(res, 200, 'Le contact demandé n\'existe pas', 'get IP');
				});
			else
				sendJsonError(res, 401, 'Unauthorized', 'getIP');
		}
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'get IP');
		}
		else if (true === result)
			getSimpleFriendList(callbackFl, uuid);
		else
			sendJsonError(res, 401, 'Unauthorized', 'get IP');
	};
	if (undefined === login || null === login)
		sendJsonError(res, 400, 'Bad request. Missing parameter', 'get IP', 'username');
	else
		checkValidityForUser(callback, uuid);
}

function addFriend(req, res)
{
	var callbackValidity, callbackFl, callbackAskFriend, uuid = res.cookies.sessId, user = req.query.username, email = req.query.email, query;
	query = 'Insert Into ami (id_user_emitter, id_user_receiver, valide) Values ((Select id From user Where id In (Select user_id From cookie Where value = "' + uuid + '")), (Select id From user Where ' + (undefined !== user ? 'login' : 'email') + ' ="' + (undefined !== user ? user : email) + '" ), 0);';
	callbackAskFriend = function(err, result)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'add friend');
		}
		else if ( -1 !== result.indexOf(user))
			sendJsonError(res, 400, 'Vous avez déjà une demande d\'amitié en attente de cette personne', 'add friend');
		else
			connection.query(query, function(err, rows, field)
			{
				if (err)
				{
					console.error(err);
					sendJsonError(res, 500, JSON.stringify(err), 'add friend');
				}
				else
					res.json(
					{
						error : false,
						invitation : 'sent'
					});
			});
	};
	callbackFl = function(err, result)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'add friend');
		}
		else if ( -1 !== result.indexOf(user))
			sendJsonError(res, 400, 'Vous êtes déjà ami avec cette personne', 'add friend');
		else
			getFriendList(callbackAskFriend, uuid, false);
	};
	callbackValidity = function(err, validity)
	{
		if (err)
			sendJsonError(res, 500, JSON.stringify(err), 'add friend');
		else if (true === validity)
			getSimpleFriendList(callbackFl, uuid);
		else
			sendJsonError(res, 401, 'Unauthorized', 'add Friend');
	};
	if (undefined === user && undefined === email)
		sendJsonError(res, 400, 'Bad request. Missing parameters', undefined, 'username || email');
	else
		checkValidityForUser(callbackValidity, uuid);
}

function answerRequest(req, res)
{
	var callbackValidity, uuid = res.cookies.sessId, user = req.query.username, validationStatus = 'true' === req.query.validate, queryAccept, queryRefuse;
	queryAccept = 'Update ami\nSet valide = 1\nWhere id_user_receiver In\n(\n\tSelect user_id\n\tFrom cookie\n\tWhere value = "' + uuid + '"\n)\nAnd id_user_emitter In\n(\n\tSelect id\n\tFrom user\n\tWhere login = "' + user + '"\n);';
	queryRefuse = 'Delete From ami\nWhere id_user_receiver In\n(\n\tSelect user_id\n\tFrom cookie\n\tWhere value = "' + uuid + '"\n)\nAnd id_user_emitter In\n(\n\tSelect id\n\tFrom user\n\tWhere login = "' + user + '"\n);';
	callbackValidity = function(err, result)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'answer Request');
		}
		else if (true === result)
			if (true === validationStatus)
				connection.query(queryAccept, function(err, rows, field)
				{
					if (err)
					{
						console.error(err);
						sendJsonError(res, 500, JSON.stringify(err), 'answer Request');
					}
					else
						res.json(
						{
							error : false,
							friendshipStatus : 'validated'
						});
				});
			else
				connection.query(queryRefuse, function(err, rows, field)
				{
					if (err)
					{
						console.error(err);
						sendJsonError(res, 500, JSON.stringify(err), 'answer Request');
					}
					else
						res.json(
						{
							error : false,
							friendshipStatus : 'refused'
						});
				});
		else
			sendJsonError(res, 401, 'Unauthorized', 'answer Request');
	};
	if (undefined === user && undefined === validationStatus)
		sendJsonError(res, 400, 'Bad request. Missing parameters', undefined, 'username || validate');
	else
		checkValidityForUser(callbackValidity, uuid)
}

function stayAlive(req, res)
{
	var callbackValidity, uuid = res.cookies.sessId;
	callbackValidity = function(err, result)
	{
		var query = 'Update cookie\nSet validity = "' + getMySQLDate(new Date(new Date().getTime() + 15 * 60000)) + '"\nWhere value = "' + uuid + '";';
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'stayAlive');
		}
		else if (true === result)
			connection.query(query, function(err, result, field)
			{
				function callbackAskFriend(err, askList)
				{
					function callbackFl(err, friendList)
					{
						var query = 'Update user\nSet user_ip = "' + req.ip + '"\nWhere id In\n(\n\tSelect user_id\n\tFrom cookie\n\tWhere value = "' + uuid + '"\n);';
						if (err)
						{
							console.error(err);
							sendJsonError(res, 500, JSON.stringify(err), 'stayAlive');
						}
						else if (0 !== askList.length && 0 !== friendList.length)
						{
							res.json(
							{
								error : false,
								stayAlive : true,
								validity : 15,
								friends : friendList,
								askFriend : askList
							});
							connection.query(query, function(err, rows, field)
							{
								if (err)
								{
									console.error(err);
									sendJsonError(res, 500, JSON.stringify(err), 'stayAlive');
								}
							});
						}
						else if (0 === askList.length && 0 !== friendList.length)
						{
							res.json(
							{
								error : false,
								stayAlive : true,
								validity : 15,
								friends : friendList,
								askFriend : null
							});
							connection.query(query, function(err, rows, field)
							{
								if (err)
								{
									console.error(err);
									sendJsonError(res, 500, JSON.stringify(err), 'stayAlive');
								}
							});
						}
						else if (0 !== askList.length && 0 === friendList.length)
						{
							res.json(
							{
								error : false,
								stayAlive : true,
								validity : 15,
								friends : null,
								askFriend : askList
							});
							connection.query(query, function(err, rows, field)
							{
								if (err)
								{
									console.error(err);
									sendJsonError(res, 500, JSON.stringify(err), 'stayAlive');
								}
							});
						}
						else
						{
							res.json(
							{
								error : false,
								stayAlive : true,
								validity : 15,
								friends : null,
								askFriend : null
							});
							connection.query(query, function(err, rows, field)
							{
								if (err)
								{
									console.error(err);
									sendJsonError(res, 500, JSON.stringify(err), 'stayAlive');
								}
							});
						}
					}
					if (err)
					{
						console.error(err);
						sendJsonError(res, 500, JSON.stringify(err), 'stayAlive');
					}
					else
						getFriendList(callbackFl, uuid, true)
				}
				if (err)
				{
					console.error(err);
					sendJsonError(res, 500, JSON.stringify(err), 'stayAlive');
				}
				else
					getFriendList(callbackAskFriend, uuid, false, true)
			});
		else
			sendJsonError(res, 401, 'Unauthorized', 'stayAlive');

	}
	checkValidityForUser(callbackValidity, uuid);
}

function search(req, res)
{
	var callback, uuid = res.cookies.sessId, user = req.query.username, lName = req.query.name, fName = req.query.firstname, email = req.query.email, query, columns, where, jsonReturned;
	callback = function(err, result)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'search');
		}
		else if (true === result)
		{
			if (undefined !== user)
				where += 'login Like "' + user.toLowerCase() + '"';
			if (undefined !== email)
			{
				columns = columns.substr(0, 29) + ', email' + columns.substr(29);
				where += '' === where ? 'email Like "' + email + '"' : ', email Like "' + email + '"';
			}
			if (undefined !== lName)
				where += '' === where ? 'nom Like "' + lName + '"' : ', nom Like "' + lName + '"';
			if (undefined !== fName)
				where += '' === where ? 'prenom Like "' + fName + '"' : ', prenom Like "' + fName + '"';
			query = 'Select ' + columns + '\nFrom user\nWhere ' + where + '\nLimit 10;';
			connection.query(query, function(err, rows, fields)
			{
				if (err)
				{
					console.error(err);
					sendJsonError(res, 500, JSON.stringify(err), 'search');
				}
				else
				{
					for (var i = 0; i < rows.length; i++)
						jsonReturned.profiles.push(
						{
							login : rows[i].displayLogin,
							email : email,
							name : rows[i].nom,
							firstname : rows[i].prenom
						});
					res.json(jsonReturned);
				}
			});
		}
		else
			sendJsonError(res, 401, 'Unauthorized', 'search');
	}
	user = undefined !== user ? user.replace(/\*/g, '%') : undefined;
	email = undefined !== email ? email.replace(/\*/g, '%') : undefined;
	lName = undefined !== lName ? lName.replace(/\*/g, '%') : undefined;
	fName = undefined !== fName ? fName.replace(/\*/g, '%') : undefined;

	if (undefined !== user)
	{
		while ( -1 !== user.indexOf('%%'))
			user = user.replace(/%%/g, '%');
		user = '%' === user ? '' : user;
	}
	if (undefined !== email)
	{
		while ( -1 !== email.indexOf('%%'))
			email = email.replace(/%%/g, '%');
		email = '%' === email ? '' : email;
	}
	if (undefined !== lName)
	{
		while ( -1 !== lName.indexOf('%%'))
			lName = lName.replace(/%%/g, '%');
		lName = '%' === lName ? '' : lName;
	}
	if (undefined !== fName)
	{
		while ( -1 !== fName.indexOf('%%'))
			fName = fName.replace(/%%/g, '%');
		fName = '%' === fName ? '' : fName;
	}
	jsonReturned =
	{
		error : false,
		profiles : []
	};
	columns = 'display_login As displayLogin, nom, prenom';
	where = '';
	if (undefined === user && undefined === email && undefined === fName && undefined === lName)
		sendJsonError(res, 400, 'Bad request. Missing parameters', undefined, 'username || email || firstname || name');
	else
		checkValidityForUser(callback, uuid);
}

function showProfile(req, res)
{
	var callbackValidity, callbackAskFriend, callbackFl, arrAskFriend, uuid = res.cookies.sessId, user = req.params.user, query = 'Select display_login As displayLogin, email, nom, prenom\nFrom user\nWhere login = "' + user.toLowerCase() + '";';;
	callbackFl = function(err, result)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'show Profile');
		}
		else if ( -1 !== arrAskFriend.indexOf(user) || -1 !== result.indexOf(user))
			connection.query(query, function(err, rows, field)
			{
				if (err)
				{
					console.error(err);
					sendJsonError(res, 500, JSON.stringify(err), 'show Profile');
				}
				else
					res.json(
					{
						error : false,
						profile :
						{
							username : rows[0].displayLogin,
							email : rows[0].email,
							name : rows[0].nom,
							firstname : rows[0].prenom
						}
					});
			});
		else
			sendJsonError(res, 401, 'Vous n\'êtes pas ami avec cette personne', 'show Profile');
	};
	callbackAskFriend = function(err, result)
	{
		arrAskFriend = result;
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'show Profile');
		}
		else
		{
			arrAskFriend = result;
			getSimpleFriendList(callbackFl, uuid);
		}

	};
	callbackValidity = function(err, result)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'show Profile');
		}
		else if (true === result)
			getFriendList(callbackAskFriend, uuid, false);
		else
			sendJsonError(res, 401, 'Unauthorized', 'show Profile');
	}
	if (undefined === user)
		sendJsonError(res, 400, 'Bad request. Missing parameters', 'show Profile', 'username');
	else
		checkValidityForUser(callbackValidity, uuid)
}

module.exports =
{
	register : register,
	connection : connect,
	disconnect : disconnect,
	modifyProfile : modifyProfile,
	addFriend : addFriend,
	answerRequest : answerRequest,
	getKey : getKey,
	getPubKey : getPubKey,
	getCliIP : getCliIP,
	stayAlive : stayAlive,
	search : search,
	showProfile : showProfile
};

/**
* Insert the UUID value stored in the cookie for the current user 
*
* @param req {Object}: Express' request object
* @param res {Object}: Express' response object 
* @param uuid {String}: the UUID corresponding to the user, as a String
* @param id {String}: the username of the current user
**/
function createCookieInDB(req, res, uuid, exp, id)
{
	var callbackFl, callbackAskFriend, idType = -1 === id.indexOf('@') ? 'login' : 'email', user_idQuery = 'Select id, nom, prenom, display_login, email\nFrom user\nWhere ' + idType + ' = "' + id + '";', cookieQuery;
	connection.query(user_idQuery, function(err, rows, field)
	{
		callbackFl = function(err, result)
		{
			callbackAskFriend = function(err, askList)
			{
				if (err)
					sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'connection');
				else
					res.json(
					{
						error : false,
						connection : true,
						validity : 15,
						user :
						{
							login : rows[0].display_login,
							email : rows[0].email,
							name : rows[0].nom,
							firstname : rows[0].prenom
						},
						friends : result,
						askFriend : askList
					});
			};
			if (err)
			{
				console.error('callback friendList : ', err);
				sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'connection');
			}
			else
				getFriendList(callbackAskFriend, uuid, false, true);
		};
		if (err)
			sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'connection');
		else
		{
			cookieQuery = 'Insert Into cookie (value, validity, user_id)\nValues ("' + uuid + '", "' + getMySQLDate(exp) + '", ' + rows[0].id + ');';
			connection.query(cookieQuery, function(err, row, field)
			{
				if (err)
				{
					console.error('callback askFriend : ', err);
					sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'connection');
				}
				else
					getFriendList(callbackFl, uuid, true);
			});
		}
	});
}

/**
* Send a JSON with the given error code and add informations based on calling function, if source parameter is provided
*
* @param res {Object}: the response object provided by Express
* @param code {Number}: HTTP error code for the response 
* @param message {String}: the message to display in the response
* @param source {String}: indicator that allow to map the function that call this one  
**/
function sendJsonError(res, code, message, source, paramList)
{
	var result =
	{
		httpErrorCode : code,
		error : true,
		displayMessage : message
	};
	if (null !== paramList && undefined !== paramList)
		result.parameters = paramList;
	if ('connection' === source)
	{
		result.connection = false;
		result.validity = -1;
		res.json(code, result);
	}
	else if ('register' === source)
	{
		result.validation = false;
		res.json(code, result);
	}
	else if ('disconnect' === source)
	{
		result.disconnect = false;
		res.json(code, result);
	}
	else if ('private Key' === source)
	{
		result.prKey = null;
		res.json(code, result);
	}
	else if ('public Key' === source)
	{
		result.user =
		{
			username : null,
			pubKey : null
		};
		res.json(code, result);
	}
	else if ('stayAlive' === source)
	{
		result.stayAlive = false;
		result.validity = -1;
		res.json(code, result);
	}
	else if ('get IP' === source)
	{
		result.ip = null;
		res.json(code, result);
	}
	else if ('add Friend' === source)
	{
		result.invitation = 'unsent';
		res.json(code, result);
	}
	else if ('answer Request' === source)
	{
		result.friendshipStatus = 'unchanged';
		res.json(code, result);
	}
	else if ('search' === source)
	{
		result.profiles = null;
		res.json(code, result);
	}
	else if ('show Profile' === source)
	{
		result.profile = null;
		res.json(code, result);
	}
	else
		res.json(code, result);
}

/**
* Check if the given UUID value is still valide (validity datetime is inferior to the current datetime)
*
* @param uuid {String}: the UUID stored in the sessId cookie
* @param cb {Function}: the callback function that accept both error and result objects
**/
function checkValidityForUser(cb, uuid, login)
{
	var query = 'Select validity\nFrom cookie\nWhere value="' + uuid + '";', now = new Date(), validity;
	if (undefined === login)
		connection.query(query, function(err, rows, fields)
		{
			if (err)
				cb(err);
			else if (rows.length !== 0)
			{
				validity = rows[0].validity;
				if (now >= validity)
					cb(undefined, true);
			}
			else
				cb(undefined, false);
		});
	if ('String' === utils.realTypeOf(login))
	{
		query = query.slice(0, query.length - 1) + '\nAnd user_id In\n(\n\tSelect id\n\tFrom user\n\tWhere login = "' + login.toLowerCase() + '"\n);';
		connection.query(query, function(err, rows, field)
		{
			if (err)
				cb(err);
			else if (rows.length !== 0)
			{
				validity = rows[0].validity;
				if (now >= validity)
					cb(undefined, true);
			}
			else
				cb(undefined, false);
		});
	}
}

/**
* Return a MySQL compliant formated String of the date received. If no date is supplied, it return the current datetime 
*
* @param date {Date}: the date to format
* @return {String} the MySQL format compliant of the date received
**/
function getMySQLDate(datetime)
{
	var date = 'Date' === utils.realTypeOf(datetime) ? datetime : new Date(), dateString = '';
	dateString = date.getFullYear() + '-' + (10 > date.getMonth() ? '0' + date.getMonth() : date.getMonth()) + '-' + (10 > date.getDate() ? '0' + date.getDate() : date.getDate()) + ' ' + (10 > date.getHours() ? '0' + date.getHours() : date.getHours()) + ':' + (10 > date.getMinutes() ? '0' + date.getMinutes() : date.getMinutes()) + ':'
			+ (10 > date.getSeconds() ? '0' + date.getSeconds() : date.getSeconds());
	return dateString;
}

/**
* Erase all the old cookies stored in the database for the current user 
*
* @param id {String}: email or username of the current user
**/
function eraseOldCookie(id)
{
	var query = 'Delete From cookie\nWhere user_id In\n(\n\tSelect id\n\tFrom user\n\tWhere ' + ( -1 === id.indexOf('@') ? 'login' : 'email') + '="' + id + '"\n);';
	connection.query(query, function(err, rows, fields)
	{
		if (err)
			console.error(err);
	});
}

/**
* Return an array with the friend list inside: username, and connection status (only if you ask for those who have validated their friendship links)
*
* @param cb {Function}: the callback function that accept both error and result objects
* @param uuid {String}: the UUID stored in the sessId cookie
* @param alreadyFriend {Boolean}: <b>/!\ Required /!\</b> <code>true</code> if you want those who have validated their friendship links (with the current user)
**/
function getFriendList(cb, uuid, alreadyFriend, emitterOnly)
{
	if (true !== utils.typeVerificator(alreadyFriend, 'Boolean'))
		cb(new TypeError('alreadyFriend parameter must be a boolean !'));
	var result = [], req, unfReq = 'Select display_login, user_connected From user Where id In (Select %s From ami Where valide = %d And %s In (Select user_id From cookie Where value = "%s"));';
	if (true !== emitterOnly || true === alreadyFriend)
	{
		req = util.format(unfReq, 'id_user_emitter', (true === alreadyFriend ? 1 : 0), 'id_user_receiver', uuid);
		connection.query(req, function(err, rows, field)
		{
			req = util.format(unfReq, 'id_user_receiver', (true === alreadyFriend ? 1 : 0), 'id_user_emitter', uuid);
			if (err)
				cb(err);
			else
			{
				for (var i = 0; i < rows.length; i++)
					if (true === alreadyFriend)
						result.push(
						{
							displayLogin : rows[i].display_login,
							connected : (1 === rows[i].user_connected)
						});
					else
						result.push(rows[i].display_login);
				connection.query(req, function(err, rows, field)
				{
					if (err)
						cb(err);
					else
					{
						for (var i = 0; i < rows.length; i++)
							if (true === alreadyFriend)
								result.push(
								{
									displayLogin : rows[i].display_login,
									connected : (1 === rows[i].user_connected)
								});
							else
								result.push(rows[i].display_login);
						cb(undefined, result);
					}
				});
			}
		});
	}
	else
	{
		req = util.format(unfReq, 'id_user_receiver', 0, 'id_user_emitter', uuid);
		connection.query(req, function(err, rows, field)
		{
			if (err)
				cb(err);
			else
			{
				for (var i = 0; i < rows.length; i++)
					result.push(rows[i].display_login);
				cb(undefined, result);
			}
		});
	}
}

/**
* Return an array of String, where each one is the username of a friend of the current user
*
* @param cb {Function}: the callback function
* @param uuid {String}: the uuid stored in the cookie, it identifie one and only one user
**/
function getSimpleFriendList(cb, uuid)
{
	var query = 'Select login From user Where id In (Select %s From ami Where valide = 1 And %s In (Select user_id From cookie Where value = "%s"));', finalQuery;
	finalQuery = util.format(query, 'id_user_emitter', 'id_user_receiver', uuid);
	connection.query(finalQuery, function(err, rows1, field1)
	{
		if (err)
			cb(err);
		else
		{
			finalQuery = util.format(query, 'id_user_receiver', 'id_user_emitter', uuid);
			connection.query(finalQuery, function(err, rows2, field2)
			{
				var result = [];
				if (err)
					cb(err);
				else if (0 === rows1.length && 0 === rows2.length)
					cb(undefined, result);
				else
				{
					for (var i = 0; i < rows1.length; i++)
						result.push(rows1[i].login);
					for (var i = 0; i < rows2.length; i++)
						result.push(rows2[i].login);
					cb(undefined, result);
				}
			});
		}
	});
}