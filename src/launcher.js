/**
 * @auth : Gael B.
 */
var ejs = require('ejs'), // Embedded JavaScript Module
express = require('express')(), // Express module
fs = require('fs'); // FileSystem Module

express.set('view engine', 'ejs');
express.get('/', function(req, res)
{
	res.render('../html/index.ejs');
}).get('/login', function(req, res)
{
	res.render('../html/login.ejs');
}).get('/logout', function(req, res)
{
	res.render('../html/logout.ejs');
}).get('/verifyAuth', function(req, res)
{
	res.render('../html/auth.ejs',
	{
		param : req.parameters
	});
}).get('/getUserPrivateKey', function(req, res)
{
	res.render('../html/userPK.ejs');
}).use(function(req, res, next)
{
	res.setHeader('Content-Type', 'text/plain');
	res.send(404, 'Page introuvable !');
})
express.listen(8080);