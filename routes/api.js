/**
* GET all APIi pages
**/
var mysql = require('mysql'), // MySQL connection module
fs = require('fs'), // File System library
hasher = require('../lib/password').saltAndHash, // saltAndHash for passwords
infos =
{
	host : 'localhost',
	user : 'pc2p',
	password : 'esgi@123',
	database : 'PC2P'
}, connection;

function register(req, res)
{
	connection = mysql.createConnection(infos);
	var login = req.query.username, email = req.query.email, fName = req.query.firstname, lName = req.query.name, hashPW = hasher(req.query.pw), query = 'Insert Into user (nom, prenom, login, email, hash_pw)\nValues ("' + fName + '", "' + lName + '", "' + login + '", "' + email + '", "' + hashPW + '");';
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
		// FIXME ajouter la création de la paire de clé utilisateur
	});
}

function connect(req, res)
{
	connection = mysql.createConnection(infos);
	var login = req.query.username, email = req.query.email, hashPW = req.query.pw, query, uuid = req.cookies.sessId || res.cookies.sessId, cookieQuery = 'Insert Into cookie (value, validity)\nValues (' + uuid + ', Date_Add(Now(), Interval 15 Minute));';
	if (login)
	{
		query = 'Select hash_pw From user Where login = ' + login;
		connection.query(query, function(err, rows, fields)
		{
			if (rows)
				if (hashPW === rows[0].hash_pw)
					createCookieInDB(req, res, connection, uuid, login);
				else
					sendJsonError(res, 'Mot de passe incorrect', 'connection');
			else if (rows && rows.length === 0)
				sendJsonError(res, 'L\'identifiant utilisateur fourni n\'existe pas dans la base de données', 'connection');
			else
				sendJsonError(res, 'err: ' + JSON.stringify(err));
		});
	}
	else if (email)
	{
		query = 'Select hash_pw From user Where email = ' + email;
		connection.query(query, function(err, rows, fields)
		{
			if (rows && rows.length !== 0)
				if (hashPW === rows[0].hash_pw)
					createCookieInDB(req, res, connection, uuid, email);
				else
					sendJsonError(res, 'Mot de passe incorrect', 'connection');
			else if (rows && rows.length === 0)
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
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
}

function modifyProfile(req, res)
{
	connection = mysql.createConnection(infos);
	var login = req.query.username, email = req.query.email, fName = req.query.firstname, lName = req.query.name, hashPW = hasher(req.query.pw);
	if (login) // FIXME remplacer par la gestion de cookie
	{
		if (login)
			connection.query('Update user\nSet login = ' + login + '\nWhere login = ' + login, function(err, rows, fields)
			{
				if (err)
					console.error(err);
			});
		if (email)
			connection.query('Update user\nSet email = ' + email + '\nWhere login = ' + login, function(err, rows, fields)
			{
				if (err)
					console.error(err);
			});
		if (fName)
			connection.query('Update user\nSet prenom = ' + fName + '\nWhere login = ' + login, function(err, rows, fields)
			{
				if (err)
					console.error(err);
			});
		if (lName)
			connection.query('Update user\nSet nom = ' + lName + '\nWhere login = ' + login, function(err, rows, fields)
			{
				if (err)
					console.error(err);
			});
		if (hashPW)
			connection.query('Update user\nSet hash_pw = ' + hashPW + '\nWhere login = ' + login, function(err, rows, fields)
			{
				if (err)
					console.error(err);
			});
	}
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
}

function getKey(req, res)
{
	connection = mysql.createConnection(infos);
	if (connected)
		connection.query('Select path_to_keys From key where id = (Select id From user Where login = ' + login, function(err, rows, fields)
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
	connection = mysql.createConnection(infos);
	// FIXME prévoir une vérification des liens d'amitié par cookie
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
}

function getCliIP(req, res)
{
	connection = mysql.createConnection(infos);
	var user = req.params.user, query = 'Select user_ip From user Where login = ' + user;
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
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
}

function stayAlive(req, res)
{
	connection = mysql.createConnection(infos);
	// FIXME parser le cookie pour trouver l'user derrière
	mysql.query('Update Table user Set timeout = ' + new Date(new Date().getTime() + 15 * 60000));
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
}

function addFriend(req, res)
{
	connection = mysql.createConnection(infos);
	// FIXME voir la gestion de cookie pour cette partie
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
}

function getConnectedList(req, res)
{
	connection = mysql.createConnection(infos);
	// FIXME voir la gestion de cookie pour cette partie
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
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
* 
*
* @param req
* @param res
* @param connection
* @param uuid
* @param id
**/
function createCookieInDB(req, res, connection, uuid, id)
{
	var userQuery = 'Update user\nSet cookieValue = ' + uuid + '\nWhere login = ' + id + ';';
	connection.query(cookieQuery, function(err, rows, field)
	{
		if (err)
		{
			console.error(err);
			sendJsonError(res, 'err: ' + JSON.stringify(err), 'register');
		}
		else
			connection.query(userQuery, function(err, rows, field)
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
	});
}

/**
* 
*
* @param res
* @param message
* @param source
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

}