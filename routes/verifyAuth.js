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
	if ( -1 < req.query.uname.indexOf('@'))
	{
		email = connection.escape(req.query.uname);
		login = undefined;
		id = 'email';
	}
	else
	{
		email = undefined;
		login = connection.escape(req.query.uname);
		id = 'login';
	}
	pw = require('../lib/password').saltAndHash(connection.escape(req.query.pw));

	connection.connect(function(err)
	{
		if (err)
		{
			console.error('error connecting: ' + err.stack);
			return;
		}
	});
	var query = 'Select ?? , hash_pw From user Where ?? = ?? ;', inserts = [id, id, 'email' === id ? email : login];
	connection.query(mysql.format(query + inserts), function(err, rows, fields)
	{
		if (err)
			throw err;
		else if (rows)
			if (rows[0][id] === email || rows[0][id] === login)
				if (rows[0].hash_pw === pw)
					connection.query('Update Table user Set user_connected = 1 Where ?? = ??', [inserts[0], inserts[2]], function(err, rows, fields)
					{
						if (err)
							throw err;
						else
							;
					});
				else
					;
			else
				;
	});
	connection.end(function(err)
	{
		if (err)
			throw err;
	});
};