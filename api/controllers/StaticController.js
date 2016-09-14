/**
 * StaticController
 *
 * @description :: Server-side logic for managing Statics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	/*
		Affiche la page d'accueil (/)
		En passant comme variable la dernière version disponible au public du CMS et le titre
	*/

		home: function(request, response) {

			Version.getLastVersion(function(version) {

				return response.view('basic-pages/homepage', {
					title: 'Accueil',
					version: version
				});

			})

		},


	/*
		Affiche le changelog (/changelog, /versions)
		En passant comme variables les différentes versions et leurs caractéristiques
	*/

		changelog: function(request, response) {

			Version.find().sort('id DESC').exec(function(err, versions) {

				if (err) {
					sails.log.error(err)
					return response.serverError();
				}

				return response.view('basic-pages/changelog', {
					title: 'Historique des versions',
					versions: versions
				});

			})

		},


	downloadPage: function (request, response) {
		return response.view('basic-pages/download', {
			title: 'Acheter le CMS'
		});
	},

	buyLicense: function (request, response) {
		return response.view('basic-pages/buy-license', {
			title: 'Acheter une licence'
		});
	},

	rentHosting: function (request, response) {
		var renew = request.param('id')
		return response.view('basic-pages/rent-hosting', {
			title: renew ? 'Renouveler un hébergement' :  'Louer un hébergement',
			renew: renew
		});
	}

};
