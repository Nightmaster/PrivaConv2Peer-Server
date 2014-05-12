/**
* @author Gael B.
* POST from signin view. Check informations and treat them
**/

var salts = require('../lib/saltsForApp'), // Salts for the passwords
mysql = require('mysql'), utils = require('../lib/utils');

exports.registration = function(req, res)
{
	var body = req.body, connection = mysql.createConnection(
	{
		host : 'localhost',
		user : 'pc2p',
		password : 'esgi@123',
		database : 'PC2P'
	}), fName, lName, pw, email, username;
	if (utils.isDefined(body.firstname) && utils.isDefined(body.name) && utils.isDefined(body.username) && utils.isDefined(body.email) && utils.isDefined(body)['email-verif'] && utils.isDefined(body.password) && utils.isDefined(body['poassword-verif']))
		if (body.password === body['password-verif'] && body.email === body['email-verif'])
		{
			fName = connection.escape(body.firstname);
			lName = connection.escape(body.name);
			username = connection.escape(body.username);
			email = connection.escape(body.email);
			pw = require('../lib/password').saltAndHash(connection.escape(body.password));
		}
		else
			res.render('resgister',
			{
				error : 'Les 2 mots de passe et les 2 e-mail doivent être identiques !'
			}); // TODO renvoyer un message d'erreur !
	else if (undefined === body.firstname === body.name === body.username === body.email === body['email-verif'] === body.password === body['poassword-verif'])
		res.render('register');
	else
	{
		var json =
		{
			error : 'Tous les champs doivent être remplis !',
			name : body.name,
			firstname : body.firstname,
			username : body.username,
			email : body.email
		};
		for ( var verif in json)
			if (json.hasOwnProperty(verif))
				if (undefined === json[verif] || null === json[verif])
					delete json[verif];
		res.render('register', json);
	}

	connection.connect(function(err)
	{
		if (err)
		{
			console.error('error connecting: ' + err.stack); // TODO renvoyer un message d'erreur !
		}
	});
	var query = 'Insert Into User (nom, prenom, login, email, hash_pw) Values (?? , ?? , ?? , ?? , ?? );', inserts = [fName, lName, username, email, pw];
	connection.query(mysql.format(query + inserts), function(err, rows, fields)
	{
		if (err)
			throw err;
		res.redirect('/');
	});
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
};