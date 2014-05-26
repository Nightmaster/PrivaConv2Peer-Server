/*!
 * @auth : Gael B.
 * Coeur de l'application
!*/

/*
 * Module dependencies.
 */
var express = require('express'), // Express modume
connectMysql = require('connect-mysql'), // Connect for MySQL module
routes = require('./routes'), // Router directory
api = require('./routes/api'), // User module
http = require('http'), // HTTP Server module
path = require('path'), // Path module
utils = require('./lib/utils'); // Utils module set as global object

global.utils = utils;

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.session(
{
	secret : require('./saltsForApp').session
}));

// development only
if ('development' == app.get('env'))
	app.use(express.errorHandler());

// https://www.npmjs.org/package/connect-mysql

/* Partie serveur web */
app.get('/', routes.index);
app.get('/signin', require('./routes/registration').registration);
app.get('/login', require('./routes/login').login);
app.get('/verifAuth', require('./routes/verifyAuth').verifyAuth);
app.get('/logout', require('./routes/logout').logout);

/* Partie API web */
app.get('/webAPI/register', api.register);
app.get('/webAPI/connect', api.connection);
app.get('/webAPI/:user/updateInfos', api.modifyProfile);
app.get('/webAPI/getPrivateKey/:user', api.getKey);
app.get('/webAPI/getPubKey/:user', api.getPubKey);

/* Erreur '404 not found', en cas de besoin */
app.use(function(req, res, next)
{
	res.setHeader('Content-Type', 'text/plain');
	res.send(404, 'Le page demandée est introuvable ou n\'existe pas !');
});

http.createServer(app).listen(app.get('port'), function()
{
	console.log('Express server listening on port ' + app.get('port'));
});
