/**
* Define routes in app.js.
*
* @param req {Object}: request Express object
* @param res {Object}: response Express object
* @author Gaël B.
**/
module.exports =
{
	index : function index(req, res)
	{
		res.render('index',
		{
			title : 'PrivaConv2Peer site web'
		});
	},
	registration : require('./registration').registration,
	login : require('./login').login,
	logout : require('./logout').logout,
	verifyAuth : require('./verifyAuth').verifyAuth,
	modifyProfile : require('./modifyProfile').modifyProfile,
	api : require('./api'),
	_404 : require('./404')._404
};