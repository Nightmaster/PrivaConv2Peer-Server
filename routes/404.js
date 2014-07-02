/**
* Display the 404 Not found page
*
* @param req {Object}: request Express object
* @param res {Object}: response Express object
* @param next {Object}: callback Express function
* @author Gaël B.
**/
exports._404 = function(req, res, next)
{
	res.status(404);
	res.render('404',
	{
		title : 'PrivaConv2Peer'
	});
	next();
}