/**
* GET logIn page.
**/

exports.signin = function(req, res)
{
	// res.setHeader('Content-Type', 'application/json');
	res.render('auth');
};