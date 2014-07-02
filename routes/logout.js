/**
* Display logout view
*
* @param req {Object}: request Express object
* @param res {Object}: response Express object
* @author Gaël B.
**/

exports.logout = function(req, res)
{
	res.render('logout');
};