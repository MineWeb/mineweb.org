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

				// Render
				return res.render('developer/dashboard', {
					title: req.__('Espace développeur'),
					plugins: results[1],
					themes: results[1]
				})

			})

		}

		return res.redirect('/user/profile')

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
