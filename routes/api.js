/**
* GET all APIi pages
**/
var mysql = require('mysql'), // MySQL connection module
fs = require('fs'), // File System library
hasher = require('../lib/password').saltAndHash, // saltAndHash for passwords
connection = mysql.createConnection(
{
	host : 'localhost',
	user : 'pc2p',
	password : 'esgi@123',
	database : 'PC2P'
});

function register(req, res)
{
	var login = req.body.username, email = req.body.email, fName = req.body.firstname, lName = req.body.name, hashPW = hasher(req.body.pw), query = 'Insert Into User (nom, prenom, login, email, hash_pw) Values (' + fName + ', ' + lName + ', ' + login + ', ' + email + ', ' + hashPW + ';';
	connection.query(query, function(err, rows, fields)
	{
		if (err)
		{
			err = err.message.split('\n')[0].split(':');
			var duplication;
			if ( -1 !== err[1].indexOf('Duplicate'))
				duplication = err[1].substr(1);
			if (login === duplication.split(' ')[2].replace('\'', ''))
				res.render('registration',
				{
					error : true,
					reason : 'login',
					displayMessage : 'Ce nom d\'utilisateur existe déjà. Veillez en choisir un autre.',
					validation : false
				});
			else if (email === duplication.split(' ')[2].replace('\'', ''))
				res.json(
				{
					error : true,
					reason : 'email',
					displayMessage : 'Ce nom d\'utilisateur existe déjà. Veillez en choisir un autre.',
					validation : false

				});
			else
				res.send(500);
		}
		else
			res.json(
			{
				error : false,
				validation : true
			});
	});
}

function connection(req, res)
{
	var login = req.body.username, email = req.body.email, hashPW = req.body.pw, query;
	if (login)
	{
		query = 'Select hash_pw From user Where login = ' + login;
		connection.query(query, function(err, rows, fields)
		{
			if (rows)
				if (hashPW === rows[0].hash_pw)
				{
					res.json(
					{
						error : false,
						connection : true,
						validity : 15
					});
					connection.query
				}
				else
					res.json(
					{
						error : true,
						displayMessage : 'Mot de passe incorrect',
						connection : false,
						validity : -1
					});
			else if (rows && rows.length === 0)
				res.json(
				{
					error : true,
					displayMessage : 'L\'identifiant utilisateur fourni n\'existe pas dans la base de données',
					connection : false,
					validity : -1
				});
			else
				res.send(500);
		});
		connection.end(function(err)
		{
			if (err)
				throw err;
		});
	}
	else if (email)
	{
		query = 'Select hash_pw From user Where email = ' + email;
		connection.query(query, function(err, rows, fields)
		{
			if (rows && rows.length !== 0)
				if (hashPW === rows[0].hash_pw)
					res.json(
					{
						error : false,
						connection : true,
						validity : 15
					});
				else
					res.json(
					{
						error : true,
						displayMessage : 'Mot de passe incorrect',
						connection : false,
						validity : -1
					});
			else if (rows && rows.length === 0)
				res.json(
				{
					error : true,
					displayMessage : 'L\'adresse email fournie n\'existe pas dans la base de données',
					connection : false,
					validity : -1
				});
			else
				res.send(500);
		});
		connection.end(function(err)
		{
			if (err)
				throw err;
		});
	}
	else
		res.send(500);

}

function modifyProfile(req, res)
{}

function getKey(req, res)
{
// FIXME prévoir une vérification du demandeur
}

function getPubKey(req, res)
{
// FIXME prévoir une vérification des liens d'amitié
}

function getCliIP(req, res)
{
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
			res.send(500);
	});
}

function stayAlive(req, res)
{
	// FIXME parser le cookie pour trouver l'user derrière
	mysql.query('Update Table user Set timeout = ' + new Date(new Date().getTime() + 15 * 60000));
}

module.exports =
{
	register : register,
	connection : connection,
	modifyProfile : modifyProfile,
	getKey : getKey,
	getPubKey : getPubKey,
	getCliIP : getCliIP
};