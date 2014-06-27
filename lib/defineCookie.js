var uuid = require('node-uuid'); // UUID Generator

exports.defineSessCookie = function(req, res, next)
{
	var cookie = req.cookies.sessId, id = uuid.v4();
	if (cookie === undefined)
	{
		res.cookie('sessId', id,
		{
			// secret : require('./saltsForApp').session,
			// signed : true,
			maxAge : 15000 * 60
		});
		res.cookies =
		{
			sessId : id,
			expiration : new Date(new Date().setMinutes(new Date().getMinutes() + 15))
		};
	}
	else
	{
		res.cookie('sessId', cookie,
		{
			maxAge : 15000 * 60
		});
		res.cookies =
		{
			sessId : cookie,
			expiration : new Date(new Date().setMinutes(new Date().getMinutes() + 15))
		}
	}
	next();
};