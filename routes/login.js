/**
* @author Gael B.
* GET authentification verification JSON.
**/

exports.login = function(req, res)
{
	res.render('auth',
	{
		param : req.parameters
	});
};