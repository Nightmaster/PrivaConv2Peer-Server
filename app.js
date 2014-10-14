/*!
* @auth : Gael B.
!*/

// Module dependencies \\
var express = require('express'), // Express module
	routes = require('./routes'), // Router module
	http = require('http'), // HTTP Server module
	path = require('path'), // Path module
	api = routes.api, // API module
	sessCookie = require('./lib/defineCookie').defineSessCookie, // Cookie definition module
	config = require('./config'); // Config informations
// End module dependencies \\

var app = express();

// all environments
app.set('port', process.env.PORT || config.port);
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
// app.use(function(req, res, next)
// {
// require('child_process').exec('mysql -u ' + config.MySQL.user + ' -p' + config.MySQL.pw + ' ' + config.MySQL.database + ' < ' + config.sqlFile);
// next();
// });
// FIXME Transformer la requête SQL en action entierrement Node.js !

if ('development' == app.get('env'))
	app.use(express.errorHandler());

/* Partie serveur web */
app.get('/', routes.index);
// XXX Modifier les pages en prenant en compte le fait que les formulaires sont envoyés en POST
app.get('/signin', routes.registration);
app.get('/login', routes.login);
app.get('/verifAuth', routes.verifyAuth);
app.get('/logout', routes.logout);

/* Partie API web */
app.get('/webAPI/register', api.register);
app.get('/webAPI/connect', api.connection);
app.get('webAPI/setListeningPort/:user', api.setListeningPort);
app.get('/webAPI/stayAlive', api.stayAlive);
app.get('/webAPI/disconnect', api.disconnect);
app.get('/webAPI/updateInfos', api.modifyProfile);
app.get('/webAPI/search', api.search);
app.get('/webAPI/addFriend', api.addFriend);
app.get('/webAPI/answerRequest', api.answerRequest);
app.get('/webAPI/getPrivateKey/:user', api.getKey);
app.get('/webAPI/getPubKey/:user', api.getPubKey);
app.get('/webAPI/getCliIP/:user', api.getCliIP);
app.get('/webAPI/showProfile/:user', api.showProfile);

/* Error '404 not found', can be useful */
app.use(routes._404);

http.createServer(app).listen(app.get('port'), function()
{
	console.log('Express server listening on port ' + app.get('port'));
});
