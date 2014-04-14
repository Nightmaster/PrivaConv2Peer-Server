/*!
 * @author Gaël B.
!*/

var assert = require('assert'), // Assert module
	cp = require('child_process'), // Child Process module
	utils = require('./utils'); // Utils module

var pass, pathTo;
function genRSA(pw, length, path)
{
	if ( !utils.typeVerificator(pw, 'String') && !utils.isInt(length))
		throw new TypeError('pw argument must be a string, and length argument an integer');
	else if (utils.typeVerificator(pw, 'String'))
		throw new TypeError('pw argument must be a string');
	else if (utils.isInt(length))
		throw new TypeError('length argument must be an integer');
	else
		(utils.typeVerificator(pw, 'String') && utils.isInt(length))
	{
		pass = pw;
		pathTo = path;
		cp.exec('openssl genrsa -aes128 -passout pass:' + pw + ' -out ' + pathTo + 'id_rsa.pem ' + length, genPubKey);
	}
}

function genPubKey(err, stdOut, stdErr)
{
	assert.ok( !err);
	cp.exec('openssl rsa -in ' + pathTo + 'id_rsa.pem -passin pass:' + pass + ' -pubout -out ' + pathTo + 'id_rsa.pub');
}

exports.genRSA = genRSA;