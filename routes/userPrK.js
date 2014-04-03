/**
* GET User Private Key.
**/

exports.index = function(req, res)
{
	var json;
	// TODO prévoir un système pour vérifier que les infos de connexion correspondent à la clé demandée
	res.render('userPrK', json);
};