/**
* @author Gael B.
* POST from signin view. Check informations and treat them
**/

var salts = require('../saltsForApp'), // Salts for the passwords
mysql = require('mysql'), // MySQL Connector
utils = require('../lib/utils'); // utils lib

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
			fName = mysql.escape(body.firstname);
			lName = mysql.escape(body.name);
			username = mysql.escape(body.username);
			email = body.email;
			pw = require('../lib/password').saltAndHash(connection.escape(body.password));
			// TODO mise en place de regex pour username, mail & PW
		}
		else
			res.render('resgister',
			{
				title : 'PriveConv2Peer',
				error : 'Les 2 mots de passe et les 2 e-mail doivent être identiques !',
				name : lName,
				firstname : fName,
				username : username,
				email : email
			});
	else if (undefined === body.firstname === body.name === body.username === body.email === body['email-verif'] === body.password === body['poassword-verif'])
		res.render('register',
		{
			title : 'PriveConv2Peer'
		});
	else
	{
		var json =
		{
			title : 'PriveConv2Peer',
			error : 'Tous les champs doivent être remplis !',
			name : lName,
			firstname : fName,
			username : username,
			email : email
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
	var query = 'Insert Into User (nom, prenom, login, email, hash_pw) Values (' + fName + ', ' + lName + ', ' + username + ', ' + email + ', ' + pw + ';';
	connection.query(query, function(err, rows, fields)
	{
		if (err)
		{
			err = err.message.split('\n')[0].split(':');
			var duplication;
			if ( -1 !== err[1].indexOf('Duplicate'))
			{
				duplication = err[1].substr(1);
				if (username === duplication.split(' ')[2].replace('\'', ''))
					res.render('registration',
					{
						title : 'PriveConv2Peer',
						error : 'Ce nom d\'utilisateur existe déjà. Veillez en choisir un autre.',
						name : lName,
						firstname : fName,
						email : email

					});
				else if (email === duplication.split(' ')[2].replace('\'', ''))
					res.render('registration',
					{
						title : 'PriveConv2Peer',
						error : 'Ce nom d\'utilisateur existe déjà. Veillez en choisir un autre.',
						name : lName,
						firstname : fName,
						username : username

					});
			}
			else
				res.send(500); // FIXME crash appli ici voir pk
		}
		/*
		 * res.location('/'); FIXME ==> ne fonctionne pas !!! res.render('index');
		 */
		res.redirect('/');
	});
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
};