/**
* Display login page
*
* @param req {Object}: request Express object
* @param res {Object}: response Express object
* @author Gaël B.
**/

exports.login = function(req, res)
{
	res.render('auth',
	{
		title : 'PrivaConv2Peer',
		param : req.query
	});
};