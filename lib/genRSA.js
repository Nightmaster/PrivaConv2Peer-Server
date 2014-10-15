/*!
 * @author Gaël B.
!*/

var assert = require('assert'), // Assert module
	cp = require('child_process'), // Child Process module
	fs = require('fs'), // File System library
	utils = require('./utils'); // Utils module

var pass, pathTo;
/**
* Generate a RSA key pair into the specified path
*
* @param pw {String}: the password for the private Key encryption
* @param length {Integer}: the length for the private key
* @param user {String}: The path where the keys will be stored
**/
function genRSA(pw, length, user)
{
	if ( !utils.typeVerificator(pw, 'String') && !utils.isInt(length))
		throw new TypeError('pw argument must be a string, and length argument an integer');
	else if ( !utils.typeVerificator(pw, 'String'))
		throw new TypeError('pw argument must be a string');
	else if ( !utils.isInt(length))
		throw new TypeError('length argument must be an integer');
	else if (utils.typeVerificator(pw, 'String') && utils.isInt(length))
	{
		pass = pw;
		pathTo = '/PrivaConv2Peer/' + user.toLowerCase() + '/';
		fs.mkdir(pathTo, 0700, function(err)
		{
			if (err)
				console.error(err);
			else
				cp.exec('openssl genrsa -aes128 -passout pass:' + pw + ' -out ' + pathTo + 'id_rsa.pem ' + length, genPubKey);
		});
	}
}

/**
* Generate the public key
*
* @param err {Error}: the error object given by the function calling this one
* @param stdOut {Object}: the standard output
* @param stdErr {Object}: the standard error output
**/
function genPubKey(err)
{
	if (err)
		console.error(err);
	else
		cp.exec('openssl req -new -x509 -keyform PEM -key -in ' + pathTo + 'id_rsa.pem -passin pass:' + pass + ' -outform DER -out  ' + pathTo + 'pub.der', function(err)
		{
			fs.chmod(pathTo + 'id_rsa.pem', '600', function(err)
			{
				if (err)
					console.error(err);
				else
					fs.chmod(pathTo + 'pub.der', '644', function(err)
					{
						if (err)
							console.error(err);
					});
			});
		});
}

function decryptTemp(pw, user, cb)
{
	pathTo = '/PrivaConv2Peer/' + user.toLowerCase() + '/'
	cp.exec('openssl pkcs8 -topk8 -inform PEM  -in id_rsa.pem -passin -pass:' + pw + ' -outform DER -out tmp.der -nocrypt', cb);
	setTimeout(function()
	{
		fs.unlink(pathTo + 'tmp.der', function(err)
		{
			if(err)
				console.error(err);
		});
	}, 5000);
}

exports.genRSA = genRSA; // Export de la fonction de génération de clé RSA
exports.decryptTemp = decryptTemp; // Export de la décryption temporaire
