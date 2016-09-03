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
				title: results[0].name,
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

			// Handle version
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

			// Handle requiremnts
			var requirements = results[0]['requirements']
			var requirementsParsed = []
			for (var name in requirements) {

				if (name != "CMS") {

					var type = name.split('--')[0] // plugin or theme
					var model = (type == "plugin") ? Plugin : Theme
					var id = name.split('--')[1] // author.slug.id
					var data = {
						slug: id.split('.')[1],
						id: id.split('.')[2]
					}

					// find
					model.findOne({slug: data.slug, id: data.id}).exec(function (err, item) {

						if (err) {
							sails.log.error(err)
						}
						else if (item !== undefined) {

							var operator = (requirements[name].split(' ').lenght > 1) ? requirements[name].split(' ')[0] : '='
							var version = (requirements[name].split(' ').lenght > 1) ? requirements[name].split(' ')[1] : requirements[name]

							name = '<a href="/market/'+type+'/'+item.slug+'">'+item.name+'</a>'
console.log({
	name: name,
	operator: operator,
	version: version
})
							requirementsParsed.push({
								name: name,
								operator: operator,
								version: version
							})

							delete id
							delete data
							delete type
						}
					})

				} else {

					var operator = (requirements[name].split(' ').lenght > 1) ? requirements[name].split(' ')[0] : '='
					var version = (requirements[name].split(' ').lenght > 1) ? requirements[name].split(' ')[1] : requirements[name]

					requirementsParsed.push({
						name: 'CMS',
						operator: operator,
						version: version
					})

					delete id
					delete data
					delete type

				}
			}
			results[0]['requirements'] = requirementsParsed
			delete requirements
			delete requirementsParsed
			console.log('JE RENDER')
			return response.view('market/plugin', {
				title: results[0].name,
				plugin: results[0],
			})
		});
	}
};
