/**
 * New node file
 */

var checksum = require('crypto'), // Crypto module for checksum function
	salts = require('../saltsForApp'); // Salt JSON file
exports.saltAndHash = function(pw)
{
	var sha = checksum.createHash('sha256');
	pw = sha.update(pw); // pre-haching the pw
	for (var i = 0; i < 65636; i++)
	{
		var sha = checksum.createHash('sha256');
		if (0 === i % 2)
			pw = sha.update(pw + salts.pw).digest('hex');
		else
			pw = sha.update(salts.pw + pw).digest('hex');
	}
	return pw;
}