/*!
 * @auth : Gael B.
 * Coeur de l'application
!*/

/*
 * Module dependencies.
 */
var express = require('express'), // Express module
	MySQLStore = require('connect-mysql')(express), // Connect for MySQL module
	routes = require('./routes'), // Router directory
	api = require('./routes/api'), // User module
	http = require('http'), // HTTP Server module
	path = require('path'), // Path module
	utils = require('./lib/utils'), // Utils module set as global object
	uuid = require('node-uuid'); // UUID Generator

global.utils = utils;

var app = express(), options =
{
	config :
	{
		user : 'pc2p',
		password : 'esgi@123',
		database : 'session'
	}
};

global.app = app;

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser(require('./saltsForApp').session));
app.use(function(req, res, next)
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
});
app.use(express.bodyParser());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env'))
	app.use(express.errorHandler());

/* Partie serveur web */
app.get('/', routes.index);
// TODO Modifier les pages en prenant en compte le fait que les formulaires sont envoyés en POST
app.get('/signin', require('./routes/registration').registration);
app.get('/login', require('./routes/login').login);
app.get('/verifAuth', require('./routes/verifyAuth').verifyAuth);
app.get('/logout', require('./routes/logout').logout);

/* Partie API web */
app.get('/webAPI/register', api.register);
app.get('/webAPI/connect', api.connection);
app.get('/webAPI/disconnect', api.disconnect);
app.get('/webAPI/:user/updateInfos', api.modifyProfile);
app.get('/webAPI/getPrivateKey/:user', api.getKey);
app.get('/webAPI/getPubKey/:user', api.getPubKey);
app.get('/webAPI/getCliIP/:user' ,api.getCliIP);
app.get('/webAPI/stayAlive', api.stayAlive);
app.get('/webAPI/search', api.search);
app.get('/webAPI/addFriend', api.addFriend);
app.get('/webAPI/getConnectedList', api.getConnectedList);

/* Erreur '404 not found', en cas de besoin */
app.use(function(req, res, next)
{
    res.status(400);
	res.render('404', 
	{
		title : 'PrivaConv2Peer'
	});
	next();
});

http.createServer(app).listen(app.get('port'), function()
{
	console.log('Express server listening on port ' + app.get('port'));
});
