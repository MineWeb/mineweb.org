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
					Theme.find({limit: 10, state:'CONFIRMED', sort: 'downloads DESC'}).exec(function (err, result) {
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
					Plugin.find({limit: 10, state:'CONFIRMED', sort: 'downloads DESC'}).exec(function (err, result) {
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
			// Handle requiremnts
			var result = []
			var supported = results[0]['supported']

			// to array
			var supportedArray = []
			for (var name in supported) {
				var entry = {}
				entry[name] = supported[name]
				supportedArray.push(entry)
			}

			// each
			async.forEach(supportedArray, function (requirement, callback) {

				var name = Object.keys(requirement)[0]

				if (name != "CMS" && name != undefined && supported[name] != undefined) {

					var model = Plugin
					var id = name // author.slug.id
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

							var operator = (supported[name].split(' ').length > 1) ? supported[name].split(' ')[0] : '='
							var version = (supported[name].split(' ').length > 1) ? supported[name].split(' ')[1] : supported[name]

							name = '<a href="/market/plugin/'+item.slug+'">'+item.name+'</a>'

							result.push({
								name: name,
								operator: operator,
								version: version
							})
							callback()

						}
						else {
							return callback()
						}
					})

				}
				else if(name == "CMS") {

					var operator = (supported[name].split(' ').length > 1) ? supported[name].split(' ')[0] : '='
					var version = (supported[name].split(' ').length > 1) ? supported[name].split(' ')[1] : supported[name]

					result.push({
						name: 'CMS',
						operator: operator,
						version: version
					})
					callback()

				}
				else {
					callback()
				}

			}, function() {

				results[0]['supported'] = result
				return response.view('market/theme', {
					title: results[0].name,
					theme: results[0],
				})

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
			var result = []
			var requirements = results[0]['requirements']

			// to array
			var requirementsArray = []
			for (var name in requirements) {
				var entry = {}
				entry[name] = requirements[name]
				requirementsArray.push(entry)
			}

			// each
			async.forEach(requirementsArray, function (requirement, callback) {

				var name = Object.keys(requirement)[0]

				if (name != "CMS" && name != undefined && requirements[name] != undefined) {

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

							var operator = (requirements[name].split(' ').length > 1) ? requirements[name].split(' ')[0] : '='
							var version = (requirements[name].split(' ').length > 1) ? requirements[name].split(' ')[1] : requirements[name]

							name = '<a href="/market/'+type+'/'+item.slug+'">'+item.name+'</a>'

							result.push({
								name: name,
								operator: operator,
								version: version
							})
							callback()

						}
						else {
							return callback()
						}
					})

				}
				else if(name == "CMS") {

					var operator = (requirements[name].split(' ').length > 1) ? requirements[name].split(' ')[0] : '='
					var version = (requirements[name].split(' ').length > 1) ? requirements[name].split(' ')[1] : requirements[name]

					result.push({
						name: 'CMS',
						operator: operator,
						version: version
					})
					callback()

				}
				else {
					callback()
				}

			}, function() {

				results[0]['requirements'] = result

				return response.view('market/plugin', {
					title: results[0].name,
					plugin: results[0],
				})

			})

		});
	}
};
