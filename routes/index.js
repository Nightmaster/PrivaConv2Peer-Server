/**
* GET home page.
**/

exports.index = function(req, res)
{
	res.render('index',
	{
		title : 'PrivaConv2Peer site web'
	});
};

// XXX utiliser ce fichier comme lieux des require plutôt que app.js
