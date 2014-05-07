/**
* @auth : Gael B.
**/

/*
 * Module dependencies.
 */
var express = require('express'), // Express modume
cookieParser = require('cookie-parser'), // Cookie Parser module
session = require('express-session'), // Session manager for Express module
favicon = require('static-favicon'), // Favicon module
bodyParser = require('body-parser'), // Body Parser module
connectMysql = require('connect-mysql'), // Connect for MySQL module
routes = require('./routes'), // Router directory
user = require('./routes/user'), // User module
http = require('http'), // HTTP Server module
path = require('path'), // Path module
utils = require('./lib/utils'); // Utils module set as global object

global.utils = utils;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser());
app.use(favicon());
app.use(session(
{
	secret : require('saltsForApp').session
}));
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env'))
	app.use(express.errorHandler());

// https://www.npmjs.org/package/connect-mysql

app.get('/', routes.index);
app.get('/signin', routes.signin);
app.post('/registration', routes.registration);
app.get('/users', user.list);
app.get('/login', routes.login);
app.post('/verifAuth', routes.verifAuth);
app.get('/logout', routes.logout);
app.get('/verifyAuth', routes.auth);
app.get('/getUserPrivateKey', routes.userPrK);
app.use(function(req, res, next)
{
	res.setHeader('Content-Type', 'text/plain');
	res.send(404, 'Le page demandée est introuvable ou n\'existe pas !');
});

http.createServer(app).listen(app.get('port'), function()
{
	console.log('Express server listening on port ' + app.get('port'));
});
