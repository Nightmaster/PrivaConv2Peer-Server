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
	if (undefined === login || undefined === email || undefined === hashPW || undefined === lName || undefined === fName || undefined === hashPwK || undefined === lengthKey)
		sendJsonError(res, 400, 'Bad request. Missing parameters', undefined, 'username && email && pw && firstname && name && pw && pwK && length');
	else
	{
		hashPw = hasher(hashPw);
		hashPwK = hasher(hashPwK);
		query = 'Insert Into user (nom, prenom, login, displayLogin, email, hash_pw)\nValues ("' + fName + '", "' + lName + '", "' + login.toLowerCase() + '", "' + login + '", "' + email + '", "' + hashPw + '");';
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
		if (login)
		{
			query = util.format(query, 'login', login.toLowerCase());
			connecQuery = util.format('Update user\nSet user_ip = "' + req.ip + '", user_connected = 1\nWhere %s="%s";', undefined !== login ? 'login' : 'email', undefined !== login ? login.toLowerCase() : email);
			connection.query(query, function(err, rows, fields)
			{
				if (0 < rows.length)
				{
					 console.log('PW BBD: ' + rows[0].hash_pw);
					 console.log('PW hashé: ' + hashPW);
					if (hashPW === rows[0].hash_pw)
					{
						eraseOldCookie(login, 'login');
						createCookieInDB(req, res, connection, uuid, expiration, login.toLowerCase());
						connection.query(connecQuery, function(err, rows, field)
						{
							if (err)
								console.error(err);
						});
					}
					else
						sendJsonError(res, 200, 'Mot de passe incorrect', 'connection');
				}
				else if (rows.length === 0)
					sendJsonError(res, 200, 'L\'identifiant utilisateur fourni n\'existe pas dans la base de données', 'connection');
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
						createCookieInDB(req, res, connection, uuid, email);
						connection.query(connecQuery, function(err, rows, field)
						{
							if (err)
								console.error(err);
						});
					}
					else
						sendJsonError(res, 200, 'Mot de passe incorrect', 'connection');
				else if (rows.length === 0)
					sendJsonError(res, 'L\'adresse email fournie n\'existe pas dans la base de données', 'connection');
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
	var query = 'Delete From cookie\nWhere value="' + res.cookies.sessId + '";';
	res.clearCookie(res.cookies.uuid);
	connection.query(query, function(err, rows, fields)
	{
		if (err)
			sendJsonError(res, 500, JSON.stringify(err), 'Disctonnect')
		else
			res.json(
			{
				error : false,
				disconnect : true
			});
	});
};

function modifyProfile(req, res)
{
	var login = req.query.username, email = req.query.email, fName = req.query.firstname, lName = req.query.name, hashPW = hasher(req.query.pw), values = '', query, jsonReturned =
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
				values += 'login = "' + login.toLowerCase() + '", displayLogin = "' + login + '"';
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
				values += '' === values ? 'hash_pw = "' + hashPW + '"' : ', hash_pw = "' + hashPW + '"';
				jsonReturned.pwChanged = true;
			}
			if ('' !== values)
			{
				query = 'Update user\nSet ' + values + '\nWhere id In\n(\n\tSelect userId\n\tFrom cookie\n\tWhere value = "' + res.cookies.sessId + '"\n);';
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
}

function getKey(req, res)
{
	var callback, uuid = res.cookies.sessId, pathTo = '/PrivaConv2Peer/' + req.params.user.toLowerCase() + 'id_rsa.pem';
	if (true === checkValidityForUser(res.cookies.sessId))
		fs.readFile(pathTo, function(err, result)
		{
			res.json(
			{
				error : false,
				prKey : result
			});
		});
	sendJsonError(res, 401, 'Unauthorized', 'Get Key');
}

function getPubKey(req, res)
{
	var callback, uuid = res.cookies.sessId, login = req.query.username;
	if (undefined === login || null === login)
		sendJsonError(res, 400, 'Bad request. Missing parameter', undefined, 'username');
	// FIXME prévoir une vérification des liens d'amitié par cookie
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

function stayAlive(req, res)
{
	var callback, uuid = res.cookies.sessId;
	// FIXME parser le cookie pour trouver l'user derrière
	mysql.query('Update Table user Set timeout = ' + new Date(new Date().getTime() + 15 * 60000));
}

function addFriend(req, res)
{
	var callback, uuid = res.cookies.sessId, login = req.query.username, email = req.query.email, query;
	if (undefined === login && undefined === email)
		sendJsonError(res, 400, 'Bad request. Missing parameters', undefined, 'username || email');
	query = 'Insert Into ami (idUserEmitter, idUserReceiver, valide) Values ((Select id From user Where id In (Select id From cookie Where value = "' + uuid + '")), (Select id From user Where ' + (undefined !== login ? 'login' : 'email') + ' ="' + (undefined !== login ? login : email) + '" ), 0);';
	callback = function(err, validity)
	{
		if (err)
			sendJsonError(res, 500, JSON.stringify(err), 'Add friend');
		if (true === validity)
			connection.query(query, function(err, rows, field)
			{
				if (err)
					sendJsonError(res, 500, JSON.stringify(err), 'Add friend');
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
	checkValidityForUser(uuid, callback);
	// FIXME voir la gestion de cookie pour cette partie
}

function getConnectedList(req, res)
{
	var callback, uuid = res.cookies.sessId;
	// FIXME voir la gestion de cookie pour cette partie
}

function search(req, res)
{
	var callback, uuid = res.cookies.sessId;
	// FIXME Ajouter la recherche d'amis ici
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
	getConnectedList : getConnectedList
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
function createCookieInDB(req, res, connection, uuid, exp, id)
{
	var idType = -1 === id.indexOf('@') ? 'login' : 'email', userIdQuery = 'Select id, nom, prenom, displayLogin, email\nFrom user\nWhere ' + idType + ' = "' + id + '";', cookieQuery;
	connection.query(userIdQuery, function(err, rows, field)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 'err: ' + JSON.stringify(err), 'register');
		}
		else
		{
			cookieQuery = 'Insert Into cookie (value, validity, userId)\nValues ("' + uuid + '", "' + getMySQLDate(exp) + '", ' + rows[0].id + ');';
			connection.query(cookieQuery, function(err, row, field)
			{
				if (err)
				{
					console.error(err);
					sendJsonError(res, 'err: ' + JSON.stringify(err), 'register');
				}
				else
					res.json(
					{
						error : false,
						connection : true,
						validity : 15,
						user :
						{
							login : rows[0].displayLogin,
							email : rows[0].email,
							name : rows[0].nom,
							firstname : rows[0].prenom
						}
					});
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
function checkValidityForUser(uuid, cb)
{
	var query = 'Select userId, validity\nFrom cookie\nWhere value="' + uuid + '";', now = new Date(), validity;
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
}

/**
* Renvoie une date au format String compréhensible par MySQL
*
* @param date {Date} : la date à mettre à formatter pour MySQL
* @return {String} la date dans le format compatible pour MySQL
**/
function getMySQLDate(date)
{
	if ('Undefined' !== utils.realTypeOf(date))
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
	var query = 'Delete From cookie\nWhere userId In\n(\n\tSelect id\n\tFrom user\n\tWhere ' + ( -1 === id.indexOf('@') ? 'login' : 'email') + '="' + id + '"\n);';
	connection.query(query, function(err, rows, fields)
	{
		if (err)
			console.error(err);
	});
}