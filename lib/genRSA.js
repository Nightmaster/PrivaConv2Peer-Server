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
	else if (utils.typeVerificator(pw, 'String'))
		throw new TypeError('pw argument must be a string');
	else if (utils.isInt(length))
		throw new TypeError('length argument must be an integer');
	else if (utils.typeVerificator(pw, 'String') && utils.isInt(length))
	{
		pass = pw;
		pathTo = '/PrivaConv2Peer/' + user.toLowerCase() + '/';
		fs.mkdirSync(pathTo, 0660)
		cp.exec('openssl genrsa -aes128 -passout pass:' + pw + ' -out ' + pathTo + 'id_rsa.pem ' + length, genPubKey);
	}
}

/**
* Génération de la clé publique suite à la création de la clé privée
*
* @param err {Object} : l'objet d'erreur de la fonction de callback
* @param stdOut {Object} : l'objet de sortie standard (standard out)
* @param stdErr {Object} : l'objet d'erreure standard (standard err)
**/
function genPubKey(err, stdOut, stdErr)
{
	assert.ok( !err);
	cp.exec('openssl rsa -in ' + pathTo + 'id_rsa.pem -passin pass:' + pass + ' -pubout -out ' + pathTo + 'id_rsa.pub');
}

exports.genRSA = genRSA; // Export de la fonction de génération de clé RSA
