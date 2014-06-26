exports.modifyProfile = function(req, res)
{
	res.render('profile',
	{
		title : 'PrivaConv2Peer',
		param : req.query
	});
};