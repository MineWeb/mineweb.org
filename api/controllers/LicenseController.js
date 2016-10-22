/**
 * LicenseController
 *
 * @description :: Server-side logic for managing Licenses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var request = require("request")

module.exports = {

	editHost: function (req, res) {

		// Check params (id, host)
		RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis ou sont mal remplis.": [
				['id', "L'id doit être spécifié"],
				['host', "Vous devez choisir un site d'installation"],
				{
					field: 'host',
					regex: /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/,
					error: "Votre site d'installation n'est pas une URL valide"
				}
			]
		}, function () {

			// Check if license exist
			License.findOne({id: req.body.id}).exec(function (err, license) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				if (license === undefined)
					return res.notFound()

				// Check if user logged is buyer
				if (license.user !== req.session.userId)
					return res.forbidden()

				// Edit on db
				License.update({id: license.id}, {host: req.body.host}).exec(function (err, licenseUpdated) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					licenseUpdated = licenseUpdated[0]
					var hostFormatted = '<a href="'+licenseUpdated.host+'" target="_blank">' + licenseUpdated.host

					// send response
					return res.json({
						status: true,
						msg: req.__("Le site d'installation a bien été modifié !"),
						inputs: {},
						data: {
							id: licenseUpdated.id,
							host: licenseUpdated.host,
							hostFormatted: hostFormatted
						}
					})

				})

			})

		})

	},

	disable: function (req, res) {
		// Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')


		// Get license
		License.findOne({id: id}).exec(function (err, license) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			if (license === undefined)
				return res.notFound()

			// If user is buyer
			if (license.user !== req.session.userId)
				return res.forbidden()

			// Disable on db
			License.update({id: id}, {state: false}).exec(function (err, licenseUpdated) {
				if (err)
					sails.log.error(err)
			})

			// Send response
			return res.json({
				status: true,
				msg: req.__("La licence a bien été désactivée !")
			})

		})

	},

	enable: function (req, res) {
		// Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')


		// Get license
		License.findOne({id: id}).exec(function (err, license) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			if (license === undefined)
				return res.notFound()

			// If user is buyer
			if (license.user !== req.session.userId)
				return res.forbidden()

			// Disable on db
			License.update({id: id}, {state: true}).exec(function (err, licenseUpdated) {
				if (err)
					sails.log.error(err)
			})

			// Send response
			return res.json({
				status: true,
				msg: req.__("La licence a bien été activée !")
			})

		})

	},

	download: function (req, res) {
		// Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

		// Get license
		License.findOne({id: id}).exec(function (err, license) {
			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			if (license === undefined)
				return res.notFound()

			// If user is buyer
			if (license.user !== req.session.userId)
				return res.forbidden()

			// Get last version
			Version.getLastVersion(function (version) {
				if (version === undefined)
					return res.notFound()

				// Read zip file
				request.post(sails.config.api.endpoint + 'cms/latest?license_id=' + license.id).pipe(res)
			})
		})

	}

};
