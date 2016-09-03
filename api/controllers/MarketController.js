/**
 * MarketController
 *
 * @description :: Server-side logic for managing all plugins/themes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async			= require('async');

module.exports = {

	/**
	 * Render the index view of the marketplace
	 */
	index: function (request, response) {
		async.parallel([
			// request 10 most populars themes
			function(callback) {
					Theme.find({limit: 10, sort: 'downloads DESC'}).exec(function (err, result) {
						if (err) {
							return callback(err, null)
						}

						// get version for each
						for (var key in result) {

							var versions = result[key]['versions']

							for (var i = 0; i < versions.length; i++) {
								if (versions[i]['public'] === false)
									delete versions[i]
							}

							versions.sort(function (a, b) {
							  return new Date(b.releaseDate) - new Date(a.releaseDate)
							});

							result[key]['version'] = versions[0].version

							delete versions

						}

						callback(null, result);
					});
			},
			// request 10 most populars plugins
			function(callback) {
					Plugin.find({limit: 10, sort: 'downloads DESC'}).exec(function (err, result) {
						if (err) {
							return callback(err, null)
						}

						// get version for each
						for (var key in result) {

							var versions = result[key]['versions']

							for (var i = 0; i < versions.length; i++) {
								if (versions[i]['public'] === false)
									delete versions[i]
							}

							versions.sort(function (a, b) {
							  return new Date(b.releaseDate) - new Date(a.releaseDate)
							});

							result[key]['version'] = versions[0].version

							delete versions

						}

						callback(null, result);

					});
			}
		],
		// when both has been returned, handle error or show view
		function(err, results) {
				if (err) {
					sails.log.error(err);
					return response.serverError();
				}

				return response.view('market/market', {
					title: 'Market',
					themes: results[0],
					plugins: results[1]
				})
		});
	},

  /**
	 * Render a theme page
	 */
	theme: function (request, response) {

    var slug = request.params.slug;
    if (slug === undefined)
      return res.notFound();

	  Theme.find({ 'slug': slug }).populate('author').exec(function (err, results) {
		  if (err) return res.serverError(err);

      if (results.length == 0)
        return res.notFound();

			var versions = results[0]['versions']

			for (var i = 0; i < versions.length; i++) {
				if (versions[i]['public'] === false)
					delete versions[i]
			}

			versions.sort(function (a, b) {
				return new Date(b.releaseDate) - new Date(a.releaseDate)
			});

			results[0]['version'] = versions[0]

			delete versions

			return response.view('market/theme', {
				title: 'Market',
				theme: results[0],
			})
		});
	},

  /**
	 * Render a plugin page
	 */
	plugin: function (request, response) {

    var slug = request.params.slug;
    if (slug === undefined)
      return res.notFound();

	  Plugin.find({ 'slug': slug }).populate('author').exec(function (err, results) {
		  if (err) return res.serverError(err);

      if (results.length == 0)
        return res.notFound();

			var versions = results[0]['versions']

			for (var i = 0; i < versions.length; i++) {
				if (versions[i]['public'] === false)
					delete versions[i]
			}

			versions.sort(function (a, b) {
				return new Date(b.releaseDate) - new Date(a.releaseDate)
			});

			results[0]['versions'] = versions
			results[0]['version'] = versions[0]

			delete versions

			return response.view('market/plugin', {
				title: 'Mineweb - ' + slug,
				plugin: results[0],
			})
		});
	}
};
