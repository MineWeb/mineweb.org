/**
 * HostingController
 *
 * @description :: Server-side logic for managing Hostings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	editHost: function (req, res) {

		// Check params (id, hostType, domain/subdomain)
		RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis.": [
				['id', "L'id doit être spécifié"],
				['hostType', 'Vous devez choisir un type de domaine'],
				{
					field: 'hostType',
					in: ['subdomain', 'domain'],
					error: "Le type du domaine n'est pas valide !"
				}
			]
		}, function () {

			var next = function () {

				// Check if hosting exist
				Hosting.findOne({id: req.body.id}).exec(function (err, hosting) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					if (hosting === undefined)
						return res.notFound()

					// Check if user logged is buyer
					if (hosting.user !== req.session.userId)
						return res.forbidden()

					// Check if domain is valid
					if (req.body.hostType == 'subdomain' && !(new RegExp(/([A-Z])\w+/gi).test(req.body.subdomain))) {
						return res.json({
							status: false,
							msg: req.__("Votre sous-domaine est invalide !"),
							inputs: {}
						})
					}

					if (req.body.hostType == 'domain' && !(new RegExp(/([a-z0-9|-]+\.)*[a-z0-9|-]+\.[a-z]+/).test(req.body.domain))) {
						return res.json({
							status: false,
							msg: req.__("Votre domaine est invalide !"),
							inputs: {}
						})
					}

					// Check if not already used
					var host = (req.body.hostType == 'domain') ? req.body.domain : req.body.subdomain
					Hosting.findOne({hostType: req.body.hostType.toUpperCase()}).populate('license', {'host': host}).exec(function (err, count) {

						if (err) {
							sails.log.error(err)
							return res.serverError()
						}

						if (count !== undefined && count.license !== undefined) {
							return res.json({
								status: false,
								msg: req.__("Votre domaine/sous-domaine est déjà utilisé !"),
								inputs: {}
							})
						}

						// Edit on server
						HostingService.editHost(hosting.id, host, req.body.hostType, function (err) {

							if (err)
								return res.serverError()

							// Edit on db
							Hosting.update({id: hosting.id}, {hostType: req.body.hostType.toUpperCase()}).exec(function (err, hostingUpdated) {

								if (err) {
									sails.log.error(err)
									return res.serverError()
								}

								License.update({hosting: hosting.id}, {host: host}).exec(function (err, licenseUpdated) {

									if (err) {
										sails.log.error(err)
										return res.serverError()
									}

									hostingUpdated = hostingUpdated[0]
									licenseUpdated = licenseUpdated[0]

									if (hostingUpdated.hostType === 'SUBDOMAIN')
										var hostFormatted = '<a href="http://'+licenseUpdated.host+'.craftwb.fr" target="_blank">http://' + licenseUpdated.host +'.craftwb.fr'
									else
										var hostFormatted = '<a href="http://'+licenseUpdated.host+'" target="_blank">http://' + licenseUpdated.host

									// send response
									return res.json({
										status: true,
										msg: req.__("Le nom de domaine a bien été modifié !"),
										inputs: {},
										data: {
											id: hostingUpdated.id,
											host: licenseUpdated.host,
											hostType: hostingUpdated.hostType,
											hostFormatted: hostFormatted
										}
									})

								})

							})

						})

					})

				})

			}

			// Check domain/subdomain
			if (req.body.hostType == 'subdomain') {
				RequestManagerService.setRequest(req).setResponse(res).valid({
					"Tous les champs ne sont pas remplis.": [
						['subdomain', "Vous devez choisir un sous-domaine"],
					]
				}, function () {
					next()
				})
			}
			else {
				RequestManagerService.setRequest(req).setResponse(res).valid({
					"Tous les champs ne sont pas remplis.": [
						['domain', "Vous devez choisir un domaine"],
					]
				}, function () {
					next()
				})
			}

		})

	}

};
