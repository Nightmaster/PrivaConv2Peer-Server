/**
* GET all APIi pages
**/
var mysql = require('mysql'), // MySQL connection module
	fs = require('fs'), // File System library
	hasher = require('../lib/password').saltAndHash, // saltAndHash for passwords
	rsa = require('../lib/genRSA').genRSA, // RSA Key generator module
	util = require('util'), // Native util module
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
	var login = req.query.username, email = req.query.email, fName = req.query.firstname, lName = req.query.name, hashPw = hasher(req.query.pw), hashPwK = hasher(req.query.pwK), lengthKey = req.query.length, query = 'Insert Into user (nom, prenom, login, displayLogin, email, hash_pw)\nValues ("' + fName + '", "' + lName + '", "' + login.toLowerCase() + '", "' + login + '", "' + email + '", "'
			+ hashPw + '");';
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
					sendJsonError(res, 'Ce nom d\'utilisateur existe déjà. Veillez en choisir un autre.', 'register');
				else if (email === duplication.split(' ')[2].replace(/\'/g, ''))
					sendJsonError(res, 'Cet email est déjà utilisé par un autre utilisateur. Veillez en choisir un autre.', 'register');
				// TODO (---) recommander récup de MdP quand implémenté
			}
			else
				sendJsonError(res, 'err: ' + JSON.stringify(err), 'register');
		}
		else
			res.json(
			{
				error : false,
				validation : true
			});
		console.log('type pwK: ' + utils.realTypeOf(hashPwK));
		// FIXME ajouter la création de la paire de clé utilisateur
		rsa(hashPwK, lengthKey, login);
	});
}

function connect(req, res)
{
	var login = req.query.username, email = req.query.email, hashPW = hasher(req.query.pw), query, connecQuery, uuid = res.cookies.sessId, expiration = res.cookies.expiration;
	if (login)
	{
		query = 'Select hash_pw\nFrom user\nWhere login = "' + login.toLowerCase() + '";';
		connecQuery = util.format('Update user\nSet user_ip = "' + req.ip + '", user_connected = 1\nWhere %s="%s";', undefined !== login ? 'login' : 'email', undefined !== login ? login.toLowerCase() : email);
		connection.query(query, function(err, rows, fields)
		{
			if (0 < rows.length)
			{
				if (hashPW === rows[0].hash_pw)
				{
					createCookieInDB(req, res, connection, uuid, expiration, login.toLowerCase());
					connection.query(connecQuery, function(err, rows, field)
					{
						if (err)
							console.error(err);
						else
							console.log('res : ' + JSON.stringify(rows));
					});
				}
				else
					sendJsonError(res, 'Mot de passe incorrect', 'connection');
			}
			else if (rows.length === 0)
			{
				console.log('0 Retour');
				sendJsonError(res, 'L\'identifiant utilisateur fourni n\'existe pas dans la base de données', 'connection');
			}
			else
			{
				console.log('err ' + err + '\nrows: ' + JSON.stringify(rows));
				sendJsonError(res, 'err: ' + JSON.stringify(err), 'connection');
			}
		});
	}
	else if (email)
	{
		query = 'Select hash_pw From user Where email = "' + email + '";';
		connection.query(query, function(err, rows, fields)
		{
			if (0 < rows.length)
				if (hashPW === rows[0].hash_pw)
					createCookieInDB(req, res, connection, uuid, email);
				else
					sendJsonError(res, 'Mot de passe incorrect', 'connection');
			else if (rows.length === 0)
				sendJsonError(res, 'L\'adresse email fournie n\'existe pas dans la base de données', 'connection');
			else
			{
				console.error(err);
				sendJsonError(res, 'err: ' + JSON.stringify(err), 'connection');
			}
		});
	}
	else
		sendJsonError(res, 'err: ' + JSON.stringify(err), 'connection');

}

function modifyProfile(req, res)
{
	var login = req.query.username, email = req.query.email, fName = req.query.firstname, lName = req.query.name, hashPW = hasher(req.query.pw);
	if (login) // FIXME remplacer par la gestion de cookie
	{
		if (login)
			connection.query('Update user\nSet login = "' + login.toLowerCase() + '", displayLogin = "' + login + '"\nWhere login = ' + login.toLowerCase(), function(err, rows, fields)
			{
				if (err)
					console.error(err);
			});
		if (email)
			connection.query('Update user\nSet email = "' + email + '"\nWhere login = ' + login.toLowerCase(), function(err, rows, fields)
			{
				if (err)
					console.error(err);
			});
		if (fName)
			connection.query('Update user\nSet prenom = "' + fName + '"\nWhere login = ' + login.toLowerCase(), function(err, rows, fields)
			{
				if (err)
					console.error(err);
			});
		if (lName)
			connection.query('Update user\nSet nom = "' + lName + '"\nWhere login = ' + login.toLowerCase(), function(err, rows, fields)
			{
				if (err)
					console.error(err);
			});
		if (hashPW)
			connection.query('Update user\nSet hash_pw = "' + hashPW + '"\nWhere login = ' + login.toLowerCase(), function(err, rows, fields)
			{
				if (err)
					console.error(err);
			});
	}
}

function getKey(req, res)
{
	if (connected)
		connection.query('Select path_to_keys From key where id = (Select id From user Where login = ' + login.toLowerCase(), function(err, rows, fields)
		{
			fs.readFile(rows[0].path_to_keys, function(err, result)
			{
				res.json(
				{
					error : false,
					prKey : result
				});
			});
		});
}

function getPubKey(req, res)
{
// FIXME prévoir une vérification des liens d'amitié par cookie
}

function getCliIP(req, res)
{
	var user = req.params.user, query = 'Select user_ip From user Where login = ' + user.toLowerCase();
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
			res.json(
			{
				error : true,
				displayMessage : 'Le contact demandé n\'existe pas'
			});
		else
			sendJsonError(res, 'err: ' + JSON.stringify(err), 'getIP');
	});
}

function stayAlive(req, res)
{
	// FIXME parser le cookie pour trouver l'user derrière
	mysql.query('Update Table user Set timeout = ' + new Date(new Date().getTime() + 15 * 60000));
}

function addFriend(req, res)
{
// FIXME voir la gestion de cookie pour cette partie
}

function getConnectedList(req, res)
{
// FIXME voir la gestion de cookie pour cette partie
}

module.exports =
{
	register : register,
	connection : connect,
	modifyProfile : modifyProfile,
	getKey : getKey,
	getPubKey : getPubKey,
	getCliIP : getCliIP,
	stayAlive : stayAlive,
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
	var idType = -1 === id.indexOf('@') ? 'login' : 'email', userIdQuery = 'Select id\nFrom user\nWhere ' + idType + ' = "' + id + '";', cookieQuery;
	connection.query(userIdQuery, function(err, rows, field)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 'err: ' + JSON.stringify(err), 'register');
		}
		else
		{
			console.log('rows: ' + JSON.stringify(rows));
			cookieQuery = 'Insert Into cookie (value, validity, userId)\nValues ("' + uuid + '", "' + exp.toISOString().slice(0, 19).replace('T', ' ') + '", ' + rows[0].id + ');';
			connection.query(cookieQuery, function(err, rows, field)
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
						validity : 15
					});
			});
		}
	});
}

/**
* Automatisation du renvoie de l'erreur 500 et du JSON avec les informations correspondantes à  l'intérieur
*
* @param res {Object} : objet response d'Express
* @param message {String} : le message correspondant à l'erreur
* @param source {String} : l'indicateur de la fonction d'origine de l'erreur. Permet d'apater le contenu du JSON en fonction  
**/
function sendJsonError(res, message, source)
{
	if ('connection' === source)
		res.json(500,
		{
			error : true,
			reason : 'SQL Error',
			displayMessage : message,
			connection : false,
			validity : -1
		});
	else if ('register' === source)
		res.json(500,
		{
			error : true,
			reason : 'SQL Error',
			displayMessage : message,
			connection : false,
			validity : -1
		});
	else
		res.json(500,
		{
			error : true,
			displayMessage : message
		})

}