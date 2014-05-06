/**
* @author Gael B.
* POST from auth view. Check informations and treat them
**/

var salts = require('../saltsForApp'), // Salts for the passwords
mysql = require('mysql');

exports.verifyAuth = function(req, res)
{
	var connection = mysql.createConnection(
	{
		host : 'localhost',
		user : 'pc2p',
		password : 'esgi@123',
		database : 'PC2P'
	}), login, email, pw, id;
	if ( -1 < req.body.uname.indexOf('@'))
	{
		email = req.body.uname;
		login = undefined;
		id = 'email';
	}
	else
	{
		email = undefined;
		login = req.body.uname;
		id = 'login';
	}
	pw = require('../lib/password').saltAndHash(req.body.pw);

	connection.connect(function(err)
	{
		if (err)
		{
			console.error('error connecting: ' + err.stack);
			return;
		}
	});
	var query = 'Select ?? , hash_pw From user Where ?? = ?? ;', inserts = [id, id, ('email' === id) ? email : login];
	connection.query(mysql.format(query + inserts), function(err, rows, fields)
	{
		if (err)
			throw err;
		// TODO Vérifier contenu des données récupérées et comparer à celles envoyées pour le PW !
	});
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
}