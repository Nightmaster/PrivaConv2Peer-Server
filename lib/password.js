/**
 * New node file
 */

var checksum = require('crypto').createHash('sha256'); // Crypto module for checksum function
exports.saltAndHash = function(pw)
{
	pw = checksum.update(pw); // pre-haching the pw
	for (var i = 0; i < 65636; i++)
		if (0 === i % 2)
			pw = checksum.update(pw + salts.pw).digest('hex');
		else
			pw = checksum.update(salts.pw + pw).digest('hex');
	return pw;
}