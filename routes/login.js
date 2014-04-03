/**
* GET logIn page.
**/

exports.index = function(req, res)
{
	res.setHeader('Content-Type', 'application/json');
	res.render('auth');
};