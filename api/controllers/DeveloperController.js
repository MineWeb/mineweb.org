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

	addPlugin: function (req, res) {

	},

	editPlugin: function (req, res) {

	},

	updatePlugin: function (req, res) {

	},

	deletePlugin: function (req, res) {

	},

	addTheme: function (req, res) {

	},

	editTheme: function (req, res) {

	},

	updateTheme: function (req, res) {

	},

	deleteTheme: function (req, res) {

	}

};
