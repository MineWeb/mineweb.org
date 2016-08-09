/**
 * StaticController
 *
 * @description :: Server-side logic for managing Statics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	home: function(request, response) {

		Version.getLastVersion(function(version) {

			return response.view('homepage', {
				title: 'Accueil',
				version: version
			});

		})

	}

};
