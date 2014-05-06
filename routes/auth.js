/**
* @author Gael B.
* GET authentification verification JSON.
**/

exports.index = function(req, res)
{
	res.render('verifyAuth',
	{
		param : req.parameters
	});
};