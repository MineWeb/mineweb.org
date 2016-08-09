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

				return response.view('homepage', {
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

				if(err) {
					console.error(err)
					return response.serverError();
				}

				return response.view('changelog', {
					title: 'Historique des versions',
					versions: versions
				});

			})

		}

};
