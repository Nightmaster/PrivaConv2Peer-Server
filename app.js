/**
* @auth : Gael B.
**/

/*
 * Module dependencies.
 */
var express = require('express'), // Express modume
routes = require('./routes'), // Router directory
user = require('./routes/user'), // User module
http = require('http'), // HTTP Server module
path = require('path'); // Path module

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env'))
{
	app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/login', routes.login);
app.get('/logout', routes.logout);
app.get('/verifyAuth', routes.auth);
app.get('/getUserPrivateKey', routes.userPrK);
app.use(function(req, res, next)
{
	res.setHeader('Content-Type', 'text/plain');
	res.send(404, 'Page introuvable !');
});

http.createServer(app).listen(app.get('port'), function()
{
	console.log('Express server listening on port ' + app.get('port'));
});
