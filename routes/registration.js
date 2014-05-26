/*!
 * @author Gael B.
 * POST from signin view. Check informations and treat them
!*/

var salts = require('../saltsForApp'), // Salts for the passwords
mysql = require('mysql'), // MySQL Connector
utils = require('../lib/utils'), // utils lib
title = 'PriveConv2Peer';

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
			if (false === regexVerif(res, username, fName, lName, email, pw))
				return;
			fName = mysql.escape(body.firstname);
			lName = mysql.escape(body.name);
			username = mysql.escape(body.username);
			email = body.email;
			pw = require('../lib/password').saltAndHash(connection.escape(body.password));
			// TODO mise en place de regex pour username, mail & PW
			sendToDB(res, username, fName, lName, email, pw);
		}
		else
			res.render('resgister',
			{
				title : title,
				error : 'Les 2 mots de passe et les 2 e-mail doivent être identiques !',
				name : lName,
				firstname : fName,
				username : username,
				email : email
			});
	else if (undefined === body.firstname === body.name === body.username === body.email === body['email-verif'] === body.password === body['poassword-verif'])
		res.render('register',
		{
			title : title
		});
	else
		notAllParamDefined(res, username, fName, lName, email, pw);
};

function regexVerif(res, username, fName, lName, email, pw)
{
	if (/[-a-zA-Z ]*/.test(fName))
	{
		res.render('register',
		{
			title : title,
			error : 'Le prénom ne peut contenir que des caractères alpha-numériques et les caractères espace ( ) et tiret (-) !'
		});
		return false;
	}
	else if (/[-a-zA-Z ]*/.test(lName))
	{
		res.render('register',
		{
			title : title,
			error : 'Le nom ne peut contenir que des caractères alpha-numériques et les caractères espace ( ) et tiret (-) !'
		});
		return false;
	}
	else if (/[-_a-zA-Z0-9]*/.test(username))
	{
		res.render('register',
		{
			title : title,
			error : 'Le nom d\'utilisateur ne doit contenir que des caractères alpha-numériques et les caractères suivants: "-" et "_" !'
		});
		return false;
	}
	else if (3 > username.length)
	{
		res.render('register',
		{
			title : title,
			error : 'Le nom d\'utilisateur doit être au moins de 4 caractères !'
		});
		return false;
	}
	else if (/[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(email))
	{
		res.render('register',
		{
			title : title,
			error : 'Vous devez rentrer une adresse email valide !'
		});
		return false;
	}
	else if (/^[-!\"§$%&/()=?+*~#\'_:\\.,@^<>£¤µa-zA-Z0-9]+$/.test(pw))
	{
		res.render('register',
		{
			title : title,
			error : 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et l\'un des caractères suivants: "-", "!", """, "§", "$" "%", "&", "/", "(", ")", "=", "?", "+", "*", "~", "#", "\'", "_", ":", "\\", ".", ",", "@", "^", "<", ">", "£", "¤", "µ"'
		});
		return false;
	}
	else if (7 > pw.length)
	{
		res.render('register',
		{
			title : title,
			error : 'Le mot de passe doit être de longueur 8 à minima'
		})
		return false;
	}
	return true;
}

function notAllParamDefined(res, username, fName, lName, email, pw)
{
	var json =
	{
		title : title,
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

function sendToDB(res, username, fName, lName, email, pw)
{
	connection.connect(function(err)
	{
		if (err)
			console.error('error connecting: ' + err.stack); // TODO renvoyer un message d'erreur !
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
						title : title,
						error : 'Ce nom d\'utilisateur existe déjà. Veillez en choisir un autre.',
						name : lName,
						firstname : fName,
						email : email

					});
				else if (email === duplication.split(' ')[2].replace('\'', ''))
					res.render('registration',
					{
						title : title,
						error : 'Ce nom d\'utilisateur existe déjà. Veillez en choisir un autre.',
						name : lName,
						firstname : fName,
						username : username
					});
			}
			else
				res.send(500);
		}
		res.redirect('/');
	});
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
}