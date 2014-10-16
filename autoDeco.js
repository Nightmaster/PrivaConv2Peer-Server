var mysql = require('mysql'), // MySQL connection module
	infos = require('../config').MySQLInformations, // Retrieve informations stored in the config file
	connection = mysql.createConnection(infos);

var getAllCookies, cbReset, cbErase;

getAllCookies = function()
{
	connection.query('Select user_id As id, validity \nFrom cookie;', function(err, rows)
	{
		if (err)
			console.error(err);
		else if(0 !== rows.length)
		{
			cbReset(rows);
			cbErase(rows);
		}
		else
		{
			console.log('stop');
			process.exit();
		}
	});
};

cbReset = function (res)
{
	for(var i = 0; i < res.length; i++)
	{
		var validity = res[i].validity.split(/[-\. :T]/);
		if(new Date() >= new Date(validity[0], validity[1]-1, validity[2], validity[3], validity[4], validity[5]))
			connection.query('Update user \nSet user_ip = "", user_connected = 0, user_port = "-1" \n Where id = ' + res[i].id + ';', function(err, rows)
			{
				if (err)
					console.error(err);
			});
	}
};

cbErase = function(res)
{
	for(var i = 0; i < res.length; i++)
	{
		var validity = res[i].validity.split(/[-\. :T]/);
		if(new Date() >= new Date(validity[0], validity[1]-1, validity[2], validity[3], validity[4], validity[5]))
			connection.query('Delete From cookie \n Where id = ' + res[i].id + ';', function(err, rows)
			{
				if (err)
					console.error(err);
			});
	}

};

getAllCookies();