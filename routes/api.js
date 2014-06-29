/**
* GET all APIi pages
**/
var fs = require('fs'), // File System library
	mysql = require('mysql'), // MySQL connection module
	util = require('util'), // Native util module
	hasher = require('../lib/password').saltAndHash, // saltAndHash for passwords
	rsa = require('../lib/genRSA').genRSA, // RSA Key generator module
	utils = require('../lib/utils'), // Personnal utils module
	infos =
	{
		host : 'localhost',
		user : 'pc2p',
		password : 'esgi@123',
		database : 'PC2P'
	}, connection = mysql.createConnection(infos);

function register(req, res)
{
	var login = req.query.username, email = req.query.email, fName = req.query.firstname, lName = req.query.name, hashPw = req.query.pw, hashPwK = req.query.pwK, lengthKey = req.query.length, query;
	if (undefined === login || undefined === email || undefined === hashPw || undefined === lName || undefined === fName || undefined === hashPwK || undefined === lengthKey)
		sendJsonError(res, 400, 'Bad request. Missing parameters', undefined, 'username && email && pw && firstname && name && pw && pwK && length');
	else
	{
		hashPw = hasher(hashPw);
		query = 'Insert Into user (nom, prenom, login, display_login, email, hash_pw)\nValues ("' + fName + '", "' + lName + '", "' + login.toLowerCase() + '", "' + login + '", "' + email + '", "' + hashPw + '");';
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
						sendJsonError(res, 200, 'Ce nom d\'utilisateur existe déjà. Veillez en choisir un autre.', 'register');
					else if (email === duplication.split(' ')[2].replace(/\'/g, ''))
						sendJsonError(res, 200, 'Cet email est déjà utilisé par un autre utilisateur. Veillez en choisir un autre.', 'register');
					// TODO (---) recommander récup de MdP quand implémenté
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
		sendJsonError(res, 400, 'Bad request. Missing parameters', undefined, '(username || email) && pw');
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
};

function modifyProfile(req, res)
{
	var uuid = res.cookies.sessId, login = req.query.username, email = req.query.email, fName = req.query.firstname, lName = req.query.name, hashPW = req.query.pw, values = '', query, jsonReturned =
	{
		error : false,
		modification : true,
		newValues : {}
	}, callback;
	if (undefined === login && undefined === email && undefined === fName && undefined === lName && undefined === hashPW)
		sendJsonError(res, 400, 'Bad request. Missing parameters', undefined, 'username || email || firstname || name || pw');
	callback = function(err, result)
	{
		if (err)
			console.error(err)
		else if (true === result)
		{
			if (login)
			{
				values += 'login = "' + login.toLowerCase() + '", display_login = "' + login + '"';
				jsonReturned.newValues.login = login;
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
				hasPW = hasher(hashPW);
				values += '' === values ? 'hash_pw = "' + hashPW + '"' : ', hash_pw = "' + hashPW + '"';
				jsonReturned.pwChanged = true;
			}
			if ('' !== values)
			{
				query = 'Update user\nSet ' + values + '\nWhere id In\n(\n\tSelect user_id\n\tFrom cookie\n\tWhere value = "' + res.cookies.sessId + '"\n);';
				connection.query(query, function(err, rows, fields)
				{
					if (err)
						sendJsonError(res, 500, err, 'Modify'); // TODO Voir pour gérer les conflits de clés uniques
					else
						res.json(200, jsonReturned);
				});
			}
		}
		else
			sendJsonError(res, 401, 'Unauthorized', 'Modify Profile');
	}
	checkValidityForUser(callback, uuid);
}

function getKey(req, res)
{
	var callback, uuid = res.cookies.sessId, login = req.params.user.toLowerCase(), pathTo = '/PrivaConv2Peer/' + login + '/id_rsa.pem';
	callback = function(err, result)
	{
		if (err)
			sendJsonError(res, 500, JSON.stringify(err), 'Get Key');
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
	checkValidityForUser(callback, uuid, login);
}

function getPubKey(req, res)
{
	var callback, uuid = res.cookies.sessId, login = req.query.username;
	if (undefined === login || null === login)
		sendJsonError(res, 400, 'Bad request. Missing parameter', undefined, 'username');
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
				sendJsonError(res, 401, 'Vous n\'êtes pas ami avec cette personne, ou il n\a pas encore accepté votre demande.', 'public Key')
		}
		if (err)
			sendJsonError(res, 500, JSON.stringify(err), 'public Key');
		else if (true === result)
			getSimpleFriendList(uuid, callbackFriendList);
		else
			sendJsonError(res, 401, 'Unauthorized', 'public Key');
	};
	checkValidityForUser(callback, uuid);
}

function getCliIP(req, res)
{
	var callback, uuid = res.cookies.sessId, user = req.params.user, query = 'Select user_ip From user Where login = ' + user.toLowerCase();
	if (undefined === login || null === login)
		sendJsonError(res, 400, 'Bad request. Missing parameter', undefined, 'username');
	mysql.query(query, function(err, rows, fields)
	{
		// FIXME faire une vérification des liens d'amitié
		if (err)
			console.error(err);
		if (rows && 0 !== rows.length)
			res.json(
			{
				error : false,
				ip : rows[0].user_ip
			});
		else if (rows && 0 === rows.length)
			sendJsonError(res, 200, 'Le contact demandé n\'existe pas', 'getIP');
		else
			sendJsonError(res, 500, 'err: ' + JSON.stringify(err), 'getIP');
	});
}

function addFriend(req, res)
{
	var callback, uuid = res.cookies.sessId, login = req.query.username, email = req.query.email, query;
	if (undefined === login && undefined === email)
		sendJsonError(res, 400, 'Bad request. Missing parameters', undefined, 'username || email');
	query = 'Insert Into ami (id_user_emitter, id_user_receiver, valide) Values ((Select id From user Where id In (Select user_id From cookie Where value = "' + uuid + '")), (Select id From user Where ' + (undefined !== login ? 'login' : 'email') + ' ="' + (undefined !== login ? login : email) + '" ), 0);';
	callback = function(err, validity)
	{
		if (err)
			sendJsonError(res, 500, JSON.stringify(err), 'Add friend');
		if (true === validity)
			connection.query(query, function(err, rows, field)
			{
				if (err)
				{
					console.error(err);
					sendJsonError(res, 500, JSON.stringify(err), 'Add friend');
				}
				else
					res.json(
					{
						error : false,
						invitation : 'sent'
					});
			});
		else
			sendJsonError(res, 401, 'Unauthorized', 'Add Friend');
	};
	checkValidityForUser(callback, uuid);
}

function stayAlive(req, res)
{
	// FIXME retourner demandes d'amis et passages HL
	var callback, uuid = res.cookies.sessId;
	callback = function(err, result)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 500, JSON.stringify(err), 'stayAlive');
		}
		else
			connection.query('Update cookie Set validity = "' + getMySQLDate(new Date(new Date().getTime() + 15 * 60000)) + '";', function(err, result, field)
			{
				if (err)
				{
					console.error(err);
					sendJsonError(res, 500, JSON.stringify(err), 'stayAlive');
				}
				else
					res.json(
					{
						error : false,
						stayAlive : true,
						validity : 15
					});
			});
	}
	checkValidityForUser(callback, uuid);
}

function search(req, res)
{
	var callback, uuid = res.cookies.sessId;
	// FIXME Ajouter la recherche d'amis ici
}

function showProfile(req, res)
{
	var callback, uuid = res.cookies.sessId;
	// FIXME Ajouter l'affichage du profile en cas de lien d'amitié ici
}

module.exports =
{
	register : register,
	connection : connect,
	disconnect : disconnect,
	modifyProfile : modifyProfile,
	getKey : getKey,
	getPubKey : getPubKey,
	getCliIP : getCliIP,
	stayAlive : stayAlive,
	search : search,
	addFriend : addFriend,
	showProfile : showProfile
};

/**
* Insère la valeur du cookie por un utilisateur connecté
*
* @param req {Object} : objet request d'Express
* @param res {Object} : objet response d'Express
* @param connection {Object} : objet de connexion de l'API node-MySQL 
* @param uuid {String} : l'uuid du cookie sous forme de <code>String</code>
* @param id {String} : l'identifiant de l'utilisateur
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
				getFriendList(uuid, callbackAskFriend, false);
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
					getFriendList(uuid, callbackFl, true);
			});
		}
	});
}

/**
* Automatisation du renvoie de l'erreur 500 et du JSON avec les informations correspondantes à  l'intérieur
*
* @param res {Object} : objet response d'Express
* @param code {Number} : code HTML de la réponse
* @param message {String} : le message correspondant à l'erreur
* @param source {String} : l'indicateur de la fonction d'origine de l'erreur. Permet d'apater le contenu du JSON en fonction  
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
	else if ('stayAlive' === source)
	{
		result.stayAlive = false;
		result.validity = -1;
		res.json(code, result);
	}
	else if ('private Key')
	{
		result.prKey = null;
		res.json(code, result);
	}
	else if ('public Key')
	{
		result.user =
		{
			username : null,
			pubKey : null
		};
		res.json(code, result);
	}
	else
		res.json(code, result);
}

/**
* Vérifie l'enregistrement du cookie dans la base, et s'il est toujours valide
*
* @param uuid {String} : l'uuid de l'utilisateur stocké dans un cookie
* @param cb {Function} : la fonction de callback à appeler après la remonté des infos de MySQL
* @return {Boolean} true si le cookie est (toujours) valide, false sinon 
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
* Renvoie une date au format String compréhensible par MySQL
*
* @param date {Date} : la date à mettre à formatter pour MySQL
* @return {String} la date dans le format compatible pour MySQL
**/
function getMySQLDate(date)
{
	if ('Date' === utils.realTypeOf(date))
		return date.toISOString().slice(0, 19).replace('T', ' ');
	else
		return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/**
* Efface tous les anciens cookies pour l'utilisateur en cours 
*
* @param id {String} : l'email ou l'username de l'utilisateur
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
* Renvoie un tableau contenant la liste des amis, ainsi que leur statut de connexion si on veut les liens validés, juste leur pseudo sinon
*
* @param uuid {String} : l'uuid du cookie de connexion
* @param cb {Function} : la fonction à appeler en cas d'erreur et suite à la récupération des résultats
* @param alreadyFriend {Boolean}: le booléen indiquant si on veut rechercher les liens d'amitié validés ou non.
**/
function getFriendList(uuid, cb, alreadyFriend)
{
	if (true !== utils.typeVerificator(alreadyFriend, 'Boolean'))
		cb(new TypeError('alreadyFriend parameter must be a boolean !'));
	var result = [], req, unfReq = 'Select display_login, user_connected From user Where id In (Select %s From ami Where valide = %d And %s In (Select user_id From cookie Where value = "%s"));';
	req = util.format(unfReq, 'id_user_emitter', (true === alreadyFriend ? 1 : 0), 'id_user_receiver', uuid);
	connection.query(req, function(err, rows, field)
	{
		req = util.format(unfReq, 'id_user_receiver', (true === alreadyFriend ? 1 : 0), 'id_user_emitter', uuid);
		if (err)
			cb(err);
		else
		{
			for (var i = 0; i < rows.length; i++)
				result.push(
				{
					displayLogin : rows[i].display_login,
					connected : (1 === rows[i].user_connected)
				});
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
						result.push(rows1[i].login);
					cb(undefined, result);
				}
			});
		}
	});
}