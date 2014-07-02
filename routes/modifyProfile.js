/**
* Display profile modification view
*
* @param req {Object}: request Express object
* @param res {Object}: response Express object
* @author Gaël B.
**/

exports.modifyProfile = function(req, res)
{
	res.render('profile',
	{
		title : 'PrivaConv2Peer',
		param : req.query
	});
};