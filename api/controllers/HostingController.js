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

					if (req.body.hostType == 'domain' && !(new RegExp(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/).test(req.body.domain))) {
						return res.json({
							status: false,
							msg: req.__("Votre domaine est invalide !"),
							inputs: {}
						})
					}

					// Check if not already used
					var host = (req.body.hostType == 'domain') ? req.body.domain : req.body.subdomain
					Hosting.count({host: host, hostType: req.body.hostType.toUpperCase()}).exec(function (err, count) {

						if (err) {
							sails.log.error(err)
							return res.serverError()
						}

						if (count > 0) {
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
							Hosting.update({id: hosting.id}, {hostType: req.body.hostType.toUpperCase(), host: host}).exec(function (err, hostingUpdated) {

								if (err) {
									sails.log.error(err)
									return res.serverError()
								}

								hostingUpdated = hostingUpdated[0]
								if (hostingUpdated.hostType === 'SUBDOMAIN')
									var hostFormatted = '<a href="http://'+hostingUpdated.host+'.craftwb.fr" target="_blank">http://' + hostingUpdated.host +'.craftwb.fr'
								else
									var hostFormatted = '<a href="http://'+hostingUpdated.host+'" target="_blank">http://' + hostingUpdated.host

								// send response
								return res.json({
									status: true,
									msg: req.__("Le nom de domaine a bien été modifié !"),
									inputs: {},
									data: {
										id: hostingUpdated.id,
										host: hostingUpdated.host,
										hostType: hostingUpdated.hostType,
										hostFormatted: hostFormatted
									}
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
