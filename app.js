/*!
 * @auth : Gael B.
 * Coeur de l'application
!*/

// Module dependencies \\
var express = require('express'), // Express module
	routes = require('./routes'), // Router module
	api = routes.api, // API module
	sessCookie = require('./lib/defineCookie').defineSessCookie, // Cookie definition module
	http = require('http'), // HTTP Server module
	path = require('path'), // Path module
	uuid = require('node-uuid'); // UUID Generator
// End module dependencies \\

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
app.use(sessCookie);
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
app.get('/signin', routes.registration);
app.get('/login', routes.login);
app.get('/verifAuth', routes.verifyAuth);
app.get('/logout', routes.logout);

/* Partie API web */
app.get('/webAPI/register', api.register);
app.get('/webAPI/connect', api.connection);
app.get('/webAPI/stayAlive', api.stayAlive);
app.get('/webAPI/disconnect', api.disconnect);
app.get('/webAPI/updateInfos', api.modifyProfile);
app.get('/webAPI/search', api.search);
app.get('/webAPI/addFriend', api.addFriend);
app.get('/webAPI/getPrivateKey/:user', api.getKey);
app.get('/webAPI/getPubKey/:user', api.getPubKey);
app.get('/webAPI/getCliIP/:user' ,api.getCliIP);
app.get('/webAPI/getConnectedList', api.getConnectedList);

/* Erreur '404 not found', en cas de besoin */
app.use(routes._404);

http.createServer(app).listen(app.get('port'), function()
{
	console.log('Express server listening on port ' + app.get('port'));
});
