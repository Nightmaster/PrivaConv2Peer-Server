/**
* GET home page.
**/

function index(req, res)
{
	res.render('index',
	{
		title : 'PrivaConv2Peer site web'
	});
};

// XXX utiliser ce fichier comme lieux des require plutôt que app.js
module.exports =
{
	index : index,
	_404 : require('./404')._404
};