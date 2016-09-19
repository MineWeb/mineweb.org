/**
 * DeveloperController
 *
 * @description :: Server-side logic for managing Developers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')

module.exports = {

	index: function (req, res) {

		if (res.locals.user.developer === 'NONE') {
			return res.render('developer/candidate', {
				title: req.__('Devenir développeur')
			})
		}
		else if (res.locals.user.developer === 'CONFIRMED') {

			async.parallel([

				// Find plugins
				function (callback) {
					Plugin.find({author: req.session.userId}).exec(function (err, plugins) {
						return callback(err, plugins)
					})
				},

				// Find themes
				function (callback) {
					Theme.find({author: req.session.userId}).exec(function (err, themes) {
						return callback(err, themes)
					})
				}

			], function (err, results) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				// Set vars
				var plugins = (results[0] === undefined) ? [] : results[0]
				var themes = (results[1] === undefined) ? [] : results[1]
				var totalDownloads = 0
				var purchases = []
				var purchasesTotalGain = 0

				// Calcul downloads
				for (var i = 0; i < plugins.length; i++) {
					totalDownloads += plugins[i].downloads
				}
				for (var i = 0; i < themes.length; i++) {
					totalDownloads += themes[i].downloads
				}

				async.parallel([

					// Find purchases of his plugins
					function (callback) {
						async.forEach(plugins, function (plugin, next) { // for each plugin, find purchases
							Purchase.find({itemId: plugin.id, type: 'PLUGIN'}).exec(function (err, purchases) {

								if (err)
									return sails.log.error(err)

								if (purchases !== undefined) {
									// Add purchases into list
									purchases.push(purchases)
									// Increment total gain
									for (var i = 0; i < purchases.length; i++) {
										if (purchases[i].paymentType !== 'FREE') // If not free
											purchasesTotalGain += plugin.price
									}
								}
								next()

							})
						}, function () {
							callback()
						})
					},

					// Find purchases of his themes
					function (callback) {
						async.forEach(themes, function (theme, next) { // for each themes, find purchases
							Purchase.find({itemId: theme.id, type: 'THEME'}).exec(function (err, purchases) {

								if (err)
									return sails.log.error(err)

								if (purchases !== undefined) {
									// Add purchases into list
									purchases.push(purchases)
									// Increment total gain
									for (var i = 0; i < purchases.length; i++) {
										if (purchases[i].paymentType !== 'FREE') // If not free
											purchasesTotalGain += theme.price
									}
								}
								next()

							})
						}, function () {
							callback()
						})
					}

				], function (err, results) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					// Render
					return res.render('developer/dashboard', {
						title: req.__('Espace développeur'),
						plugins: plugins,
						themes: themes,
						totalDownloads: totalDownloads,
						purchases: purchases,
						purchasesTotalGain: purchasesTotalGain
					})

				})

			})

		}
		else {

			return res.redirect('/user/profile')

		}

	},

	candidate: function (req, res) {
		RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis.": [
				['content', "Vous ne pouvez pas envoyer une candidature vide"],
			]
		}, function () {

			// Check if isn't developer
			if (res.locals.user.developer !== 'NONE') {
				return res.json({
					status: false,
					msg: req.__("Vous avez déjà soumis une candidature ! Vous devez attendre la réponse avant de pouvoir en soumettre une nouvelle."),
					inputs: {}
				})
			}

			// Update user developer status & save candidate
			User.update({id: req.session.userId}, {developer: 'CANDIDATE', developerCandidacy: req.body.content}).exec(function (err, userUpdated) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				return res.json({
					status: true,
					msg: req.__("Vous avez bien soumis votre candidature ! Vous devriez recevoir une réponse sous peu."),
					inputs: {}
				})

			})

		})
	},

	editPayPalData: function (req, res) {
		// Handle request
		RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis.": [
				['paypalDeveloperEmail', "Vous devez spécifier un email"],
			],
			"Vous devez choisir un email valide !": [
				{
					field: 'paypalDeveloperEmail',
					regex: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
					error: "Cet email n'a pas un format valide."
				}
			]
		}, function () {

			// If not already used
			User.count({paypalDeveloperEmail: req.body.paypalDeveloperEmail}).exec(function (err, count) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				// Already used
				if (count > 0) {
					return res.json({
						status: false,
						msg: req.__("Vous devez choisir un email non utilisé !"),
						inputs: {
							email: req.__("Cet email est déjà utilisé.")
						}
					})
				}

				// Save
				User.update({id: req.session.userId}, {paypalDeveloperEmail: req.body.paypalDeveloperEmail}).exec(function (err, userUpdated) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					return res.json({
						status: true,
						msg: req.__("Vous avez bien modifié votre adresse email PayPal !"),
						inputs: {}
					})

				})

			})

		})
	},

	addPluginPage: function (req, res) {

	},

	addPlugin: function (req, res) {

	},

	editPluginPage: function (req, res) {
		// get id
		if (req.param('id') === undefined) {
			return res.notFound('ID is missing')
		}
		var id = req.param('id')

		async.parallel([

			// Find plugin
			function (callback) {
				Plugin.findOne({id: id}).exec(function (err, plugin) {
					if (err)
						return callback(err)

					var requirements = []
					// Handle requirements
					for (var type in plugin.requirements) {

						// handle operator & version
						var split = plugin.requirements[type].split(' ')
						if (split.length === 2) {
							var operator = split[0]
							var version = split[1]
						}
						else {
							var operator = '='
							var version = plugin.requirements[type]
						}

						// push
						requirements.push({
							type: type,
							operator: operator,
							version: version
						})

						delete split
						delete operator
						delete version

					}

					plugin.requirements = requirements
					callback(undefined, plugin)

				})
			},

			// Find plugins
			function (callback) {
				Plugin.find().populate(['author']).exec(function (err, plugins) {
					if (err)
						return callback(err, undefined)

					var pluginsList = []
					async.forEach(plugins, function (plugin, next) {

						// list versions into array
						var versionsAvailable = []
						for (var i = 0; i < plugin.versions.length; i++) {
							if (plugin.versions[i].public)
								versionsAvailable.push(plugin.versions[i].version)
						}

						// push
						pluginsList.push({
							dbId: plugin.id,
							id: plugin.author.username.toLowerCase() + '.' + plugin.slug.toLowerCase() + '.' + plugin.id,
							name: plugin.name,
							versionsAvailable: versionsAvailable
						})

						next()

					}, function () {
						callback(undefined, pluginsList)
					})
				})
			},

			// Find themes
			function (callback) {
				Theme.find().populate(['author']).exec(function (err, themes) {
					if (err)
						return callback(err, undefined)

					var themesList = []
					async.forEach(themes, function (theme, next) {

						// list versions into array
						var versionsAvailable = []
						for (var i = 0; i < theme.versions.length; i++) {
							if (theme.versions[i].public)
								versionsAvailable.push(theme.versions[i].version)
						}

						// push
						themesList.push({
							dbId: theme.id,
							id: theme.author.username.toLowerCase() + '.' + theme.slug.toLowerCase() + '.' + theme.id,
							name: theme.name,
							versionsAvailable: versionsAvailable
						})

						next()

					}, function () {
						callback(undefined, themesList)
					})
				})
			},

			// Find CMS versions
			function (callback) {
				Version.find({state:'RELEASE'}).exec(function (err, versions) {
					if (err)
						return callback(err)

					var versionsAvailable = []
					for (var i = 0; i < versions.length; i++) {
						versionsAvailable.push(versions[i].version)
					}

					callback(undefined, versionsAvailable)

				})
			}

		], function (err, results) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			if (results[0] === undefined)
				return res.notFound()

			// render
			return res.render('developer/edit_plugin', {
				title: req.__('Edition de votre plugin'),
				plugin: results[0],
				pluginsList: results[1],
				themesList: results[2],
				cmsVersionsAvailables: results[3]
			})

		})

	},

	editPlugin: function (req, res) {
		RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis.": [
				['name', "Vous devez spécifier un nom"],
				['price', "Vous devez spécifier un prix (0 pour gratuit)"],
				['img', "Vous devez spécifier une URL d'image d'illustration"],
			]
		}, function () {

			// get id
			if (req.param('id') === undefined) {
				return res.notFound('ID is missing')
			}
			var id = req.param('id')

			// If plugin exist
			Plugin.findOne({id: id}).exec(function (err, plugin) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				if (plugin === undefined)
					return res.notFound()

				// if not author
				if (plugin.author !== req.session.userId)
					return res.forbidden()

				/*
				=== Handle body parse ===
				*/

				var requirements = []
				var versions = []
				var alreadyDoneRequirements = []
				var alreadyDoneVersions = []

				for (var key in req.body) {
					if (key.indexOf('requirements[') != '-1') { // match a requirement

						var nb = /\[\d\]/g.exec(key)[0].substr(1).slice(0, 1)

						if (alreadyDoneRequirements.indexOf(nb) == '-1') {

							requirements.push({
								type: req.body['requirements['+nb+'][type]'],
								operator: req.body['requirements['+nb+'][operator]'],
								version: req.body['requirements['+nb+'][version]']
							})
							alreadyDoneRequirements.push(nb)

						}

					}
					else if (key.indexOf('versions[') != '-1') { // match versions

						var nb = /\[\d\]/g.exec(key)[0].substr(1).slice(0, 1)

						if (alreadyDoneVersions.indexOf(nb) == '-1') {

							var push = {}
							push[req.body['versions['+nb+'].version']] = req.body['versions['+nb+'].changelog[]']
							versions.push(push)
							delete push
							alreadyDoneVersions.push(nb)

						}

					}
				}

				req.body.requirements = requirements
				req.body.versions = versions

				delete requirements
				delete versions

				/*
				=== Handle changelog ===
				*/

				for (var i = 0; i < plugin.versions.length; i++) {

					var search = req.body.versions.find(function (obj) {
						return Object.keys(obj)[0] === plugin.versions[i].version
					})

					// If find a version in body with this version
					if (search !== undefined && plugin.versions[i].public) {
						// update changelog with body content
						plugin.versions[i].changelog['fr_FR'] = (typeof search[plugin.versions[i].version] === 'object') ? search[plugin.versions[i].version] : [search[plugin.versions[i].version]]
					}

					delete search

				}

				/*
				=== Handle requirements ===
				*/
				var requirements = {}
				for (var i = 0; i < req.body.requirements.length; i++) {
					if (req.body.requirements[i].version !== undefined && req.body.requirements[i].version.length > 0 && req.body.requirements[i].type !== undefined && req.body.requirements[i].type.length > 0 && req.body.requirements[i].operator !== undefined && req.body.requirements[i].operator.length > 0) {
						var operator = (req.body.requirements[i].operator === '=') ? '' : req.body.requirements[i].operator + ' '
						requirements[req.body.requirements[i].type] = operator + req.body.requirements[i].version
						delete operator
					}
				}

				/*
					Save
				*/
				Plugin.update({id: plugin.id}, {
					name: req.body.name,
					price: req.body.price,
					img: req.body.img,
					requirements: requirements,
					versions: plugin.versions
				}).exec(function (err, pluginUpdated) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					// Notification
					NotificationService.success(req, req.__('Vous avez bien modifié votre plugin !'))

					// render
					res.jsonx({
						status: true,
						msg: req.__('Vous avez bien modifié votre plugin !'),
						inputs:{}
					})

				})

			})
		})
	},

	updatePluginPage: function (req, res) {

	},

	updatePlugin: function (req, res) {

	},

	deletePlugin: function (req, res) {

	},

	addThemePage: function (req, res) {

	},

	addTheme: function (req, res) {

	},

	editThemePage: function (req, res) {

	},

	editTheme: function (req, res) {

	},

	updateThemePage: function (req, res) {

	},

	updateTheme: function (req, res) {

	},

	deleteTheme: function (req, res) {

	}

};
