/**
 * DeveloperController
 *
 * @description :: Server-side logic for managing Developers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')
var path = require('path')
var slugify = require('slugify')
var Entities = require('html-entities').AllHtmlEntities
var htmlentities = new Entities()

module.exports = {

	getPluginsThemesCmsVersionsAvailables: function (next) {
		async.parallel([

			// Find plugins
			function (callback) {
				Plugin.find({state:'CONFIRMED'}).populate(['author']).exec(function (err, plugins) {
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
				Theme.find({state:'CONFIRMED'}).populate(['author']).exec(function (err, themes) {
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
			if (err)
				return next(err)
			return next(undefined, results)
		})
	},

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
					Plugin.find({author: req.session.userId, state:'CONFIRMED'}).exec(function (err, plugins) {
						return callback(err, plugins)
					})
				},

				// Find themes
				function (callback) {
					Theme.find({author: req.session.userId, state:'CONFIRMED'}).exec(function (err, themes) {
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
						Purchase.query('SELECT plugin.name, SUM(paypalhistory.paymentAmount - paypalhistory.taxAmount) AS total FROM plugin INNER JOIN purchase ON purchase.itemId = plugin.id AND purchase.type = \'PLUGIN\' INNER JOIN paypalhistory ON paypalhistory.id = purchase.paymentId WHERE plugin.author = ' + req.session.userId + ' GROUP BY plugin.id;', function (err, results) {
						  if (err) {
						    sails.log.error(err)
						    return callback()
              }
              for (plugin in results)
                purchasesTotalGain += results[plugin].total
              callback()
            })
					},

					// Find purchases of his themes
          function (callback) {
            Purchase.query('SELECT theme.name, SUM(paypalhistory.paymentAmount - paypalhistory.taxAmount) AS total FROM theme INNER JOIN purchase ON purchase.itemId = theme.id AND purchase.type = \'THEME\' INNER JOIN paypalhistory ON paypalhistory.id = purchase.paymentId WHERE theme.author = ' + req.session.userId + ' GROUP BY theme.id;', function (err, results) {
              if (err) {
                sails.log.error(err)
                return callback()
              }
              for (theme in results)
                purchasesTotalGain += results[theme].total
              callback()
            })
          },

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

      req.body.content = htmlentities.encode(req.body.content)
      req.body.content = req.body.content.replace(/(?:\r\n|\r|\n)/g, '<br />')

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
		this.getPluginsThemesCmsVersionsAvailables(function (err, results) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			// render
			return res.render('developer/edit_plugin', {
				title: req.__('Ajout de plugin'),
				plugin: { // fake plugin
					name: undefined,
					slug: req.__('Remplissage automatique'),
					prix: undefined,
					version: '1.0.0',
					img: undefined,
					versions: [],
					requirements: []
				},
				pluginsList: results[0],
				themesList: results[1],
				cmsVersionsAvailables: results[2],
				add: true
			})

		})
	},

	editPluginPage: function (req, res) {
		// get id
		if (req.param('id') === undefined) {
			return res.notFound('ID is missing')
		}
		var id = req.param('id')
		var self = this

		async.parallel([

			// Find plugin
			function (callback) {
				Plugin.findOne({id: id, state:'CONFIRMED'}).exec(function (err, plugin) {
					if (err)
						return callback(err)

					if (plugin === undefined)
						return callback(undefined, undefined)

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
					}
					plugin.requirements = requirements
					callback(undefined, plugin)
				})
			},

			//
			function (callback) {
				self.getPluginsThemesCmsVersionsAvailables(function (err, results) {
					callback(err, results)
				})
			}

		], function (err, results) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			if (results[0] === undefined)
				return res.notFound()

			if (results[0].author !== req.session.userId)
				return res.forbidden()

			// render
			return res.render('developer/edit_plugin', {
				title: req.__('Edition de votre plugin'),
				plugin: results[0],
				pluginsList: results[1][0],
				themesList: results[1][1],
				cmsVersionsAvailables: results[1][2]
			})

		})

	},

	// add or edit
	editPlugin: function (req, res) {
		var add = (req.path === '/developer/add/plugin')
    var data = JSON.parse(req.body.data);

		if (add) {

			RequestManagerService.setRequest(req).setBody(data).setResponse(res).valid({
				"Tous les champs ne sont pas remplis.": [
					['name', "Vous devez spécifier un nom"],
					['price', "Vous devez spécifier un prix (0 pour gratuit)"],
					['img', "Vous devez spécifier une URL d'image d'illustration"],
					['description', "Vous devez spécifier une description"],
					{field: 'files', file: true, error: "Vous devez envoyer des fichiers"},
				]
			}, function () {

				parseBody()

			})

		}
		else { // edit
			RequestManagerService.setRequest(req).setBody(data).setResponse(res).valid({
				"Tous les champs ne sont pas remplis.": [
					['name', "Vous devez spécifier un nom"],
					['price', "Vous devez spécifier un prix (0 pour gratuit)"],
					['img', "Vous devez spécifier une URL d'image d'illustration"],
					['description', "Vous devez spécifier une description"]
				]
			}, function () {

				// get id
				if (req.param('id') === undefined) {
					return res.notFound('ID is missing')
				}
				var id = req.param('id')

				// If plugin exist
				Plugin.findOne({id: id, state:'CONFIRMED'}).exec(function (err, plugin) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					if (plugin === undefined)
						return res.notFound()

					// if not author
					if (plugin.author !== req.session.userId)
						return res.forbidden()

					parseBody(plugin)

				})
			})
		}

		function parseBody(plugin) {
      var requirements = {};

      for (i in data.requirements) {
        requirements[data.requirements[i].type] = data.requirements[i].operator + ' ' + data.requirements[i].version
      }
      if (!add) {
        for (i in plugin.versions) {
          for (index in data.versions) {
            if (data.versions[index].version == plugin.versions[i].version) {
              plugin.versions[index].changelog['fr_FR'] = data.versions[index].changelog
              break;
            }
          }
        }
      }

			if (add)
				savePlugin(requirements)
			else
				updatePlugin(plugin, requirements)
		}

		function updatePlugin(plugin, requirements) {
			Plugin.update({id: plugin.id}, {
				name: data.name,
				price: data.price,
				img: data.img,
				description: data.description,
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
				res.json({
					status: true,
					msg: req.__('Vous avez bien modifié votre plugin !'),
					inputs:{}
				})

			})
		}
		function savePlugin(requirements) {

			//global.requirements = requirements

			// try to upload files
			req.file("files").upload({

	       saveAs: function (file, cb) { // Check extension & content-type

	          var extension = file.filename.split('.').pop()

	          // seperate allowed and disallowed file types
	          if ((file.headers['content-type'] !== 'application/zip' && file.headers['content-type'] !== 'application/x-zip-compressed' && file.headers['content-type'] !== 'application/octet-stream') || extension != 'zip') {
	            // don't save
							return res.json({
								status: false,
								msg: req.__("Vous avez tenté d'envoyer un fichier autre qu'une archive zip ou n'ayant pas la bonne extension."),
								inputs:{}
							})
	          }
						else {
	            // save
							var name = req.session.userId + '-' + slugify(data.name) + '.zip'
	            cb(null, path.join(__dirname, '../../', sails.config.developer.upload.folders.plugins, name))
	          }

	       }

	    },function whenDone (err, file) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				 // save in db
				 Plugin.create({
					 name: data.name,
					 price: data.price,
					 img: data.img,
					 description: data.description,
					 requirements: requirements,
					 versions: '[{"version":"1.0.0","public":false,"changelog":{"fr_FR":["Mise en place du plugin"]},"releaseDate":null}]',
					 author: req.session.userId,
					 version: '1.0.0'
				 }).exec(function (err, pluginCreated) {

					 if (err) {
						 sails.log.error(err)
						 return res.serverError()
					 }

					 // Pushbullet
					 PushbulletService.push('Nouveau plugin à vérifier', RouteService.getBaseUrl() + '/admin/developer/plugin/validate/' + pluginCreated.id, 'Plugin', pluginCreated.id, [sails.config.pushbullet.principalEmail])

					 // Notification
					 NotificationService.success(req, req.__('Vous avez bien ajouté votre plugin ! Il sera vérifié et validé sous peu.'))

					 // render
					 res.json({
						 status: true,
						 msg: req.__('Vous avez bien ajouté votre plugin ! Il sera vérifié et validé sous peu.'),
						 inputs:{}
					 })

				 })

	    })

		}

	},

	updatePluginPage: function (req, res) {
		// get id
		if (req.param('id') === undefined) {
			return res.notFound('ID is missing')
		}
		var id = req.param('id')

		Plugin.findOne({id:id, state:'CONFIRMED'}).exec(function (err, plugin) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			if (plugin === undefined)
				return res.notFound()

			if (plugin.author !== req.session.userId || !plugin.versions[0].public)
				return res.forbidden()

			// render
			return res.render('developer/update_plugin', {
				title: req.__('Ajouter une version à votre plugin'),
				plugin: plugin
			})

		})
	},

	updatePlugin: function (req, res) {
		// get id
		if (req.param('id') === undefined) {
			return res.notFound('ID is missing')
		}
		var id = req.param('id')

		if (req.body['versionChangelog[]'] !== undefined && typeof req.body['versionChangelog[]'] !== 'object')
			req.body['versionChangelog[]'] = [req.body['versionChangelog[]']]

		// check request
		RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis.": [
				['versionName', "Vous devez spécifier un nom de version"],
				['versionChangelog[]', 'Vous devez au moins ajouter 1 changement'],
				{
					field: 'versionChangelog[]',
					arrayValueNeedFilled: '0',
					error: 'Vous devez au moins ajouter 1 changement'
				},
				{field: 'files', file: true, error: "Vous devez envoyer des fichiers"}
			],
			"Votre nom de version est incorrect.": [
				{
					field: 'versionName',
					regex: /^(\d+\.)(\d+\.)(\*|\d+)$/g,
					error: 'Vous devez mettre une version au format X.X.X'
				}
			]
		}, function () {

			// find plugin
			Plugin.findOne({id:id, state:'CONFIRMED'}).exec(function (err, plugin) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				// not found
				if (plugin === undefined)
					return res.notFound()

				// not author
				if (plugin.author !== req.session.userId || !plugin.versions[0].public)
					return res.forbidden()

				// add version
				plugin.versions.unshift({
					version: req.body.versionName,
					public: false,
					changelog: {
						'fr_FR': req.body['versionChangelog[]']
					}
				})

				// try to upload files
				req.file("files").upload({

					 saveAs: function (file, cb) { // Check extension & content-type

							var extension = file.filename.split('.').pop()

							// seperate allowed and disallowed file types
							if ((file.headers['content-type'] !== 'application/zip' && file.headers['content-type'] !== 'application/x-zip-compressed' && file.headers['content-type'] !== 'application/octet-stream') || extension != 'zip') {
								// don't save
								return res.json({
									status: false,
									msg: req.__("Vous avez tenté d'envoyer un fichier autre qu'une archive zip ou n'ayant pas la bonne extension."),
									inputs:{}
								})
							}
							else {
								// save
								var name = req.session.userId + '-' + plugin.slug + '-v' + req.body.versionName + '.zip'
								cb(null, path.join(__dirname, '../../', sails.config.developer.upload.folders.plugins, name))
							}

					 }

				},function whenDone (err, file) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					// Save
					Plugin.update({id: id}, {versions: plugin.versions}).exec(function (err, pluginUpdated) {

						if (err) {
							sails.log.error(err)
							return res.serverError()
						}

						// Pushbullet
						PushbulletService.push('Nouvelle version de plugin à vérifier', RouteService.getBaseUrl() + '/admin/developer/plugin/update/validate/' + id, 'Plugin', id, [sails.config.pushbullet.principalEmail])

						// Notification
						NotificationService.success(req, req.__('Vous avez bien ajouté une nouvelle version à votre plugin ! Elle sera vérifiée et validée sous peu.'))

						// render
						res.json({
							status: true,
							msg: req.__('Vous avez bien ajouté une nouvelle version à votre plugin ! Elle sera vérifiée et validée sous peu.'),
							inputs:{}
						})

					})

				})

			})

		})
	},

	deletePlugin: function (req, res) {
		// get id
		if (req.param('id') === undefined) {
			return res.notFound('ID is missing')
		}
		var id = req.param('id')

		Plugin.findOne({id: id, state:'CONFIRMED'}).exec(function (err, plugin) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			if (plugin === undefined)
				return res.notFound()

			if (plugin.author !== req.session.userId)
				return res.forbidden()

			Plugin.update({id: id}, {state:'DELETED'}).exec(function (err, pluginUpdated) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				// Notification
				NotificationService.success(req, req.__('Vous avez bien supprimé votre plugin !'))

				// redirect
				res.redirect('/developer')

			})

		})

	},

	addThemePage: function (req, res) {
		this.getPluginsThemesCmsVersionsAvailables(function (err, results) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			// render
			return res.render('developer/edit_theme', {
				title: req.__('Ajout de thème'),
				theme: { // fake theme
					name: undefined,
					slug: req.__('Remplissage automatique'),
					prix: undefined,
					version: '1.0.0',
					img: undefined,
					versions: [],
					supported: []
				},
				pluginsList: results[0],
				cmsVersionsAvailables: results[2],
				add: true
			})

		})
	},

	editThemePage: function (req, res) {
		// get id
		if (req.param('id') === undefined) {
			return res.notFound('ID is missing')
		}
		var id = req.param('id')
		var self = this

		async.parallel([

			// Find theme
			function (callback) {
				Theme.findOne({id: id, state:'CONFIRMED'}).exec(function (err, theme) {
					if (err)
						return callback(err)

					if (theme === undefined)
						return callback(undefined, undefined)

					var supported = []
					// Handle supported
					for (var type in theme.supported) {

						// handle operator & version
						var split = theme.supported[type].split(' ')
						if (split.length === 2) {
							var operator = split[0]
							var version = split[1]
						}
						else {
							var operator = '='
							var version = theme.supported[type]
						}

						// push
						supported.push({
							type: type,
							operator: operator,
							version: version
						})





					}

					theme.supported = supported
					callback(undefined, theme)

				})
			},

			//
			function (callback) {
				self.getPluginsThemesCmsVersionsAvailables(function (err, results) {
					callback(err, results)
				})
			}

		], function (err, results) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			if (results[0] === undefined)
				return res.notFound()

			if (results[0].author !== req.session.userId)
				return res.forbidden()

			// render
			return res.render('developer/edit_theme', {
				title: req.__('Edition de votre thème'),
				theme: results[0],
				pluginsList: results[1][0],
				cmsVersionsAvailables: results[1][2]
			})

		})

	},

	// add or edit
	editTheme: function (req, res) {
		var add = (req.path === '/developer/add/theme')
    var data = JSON.parse(req.body.data);

		if (add) {

			RequestManagerService.setRequest(req).setBody(data).setResponse(res).valid({
				"Tous les champs ne sont pas remplis.": [
					['name', "Vous devez spécifier un nom"],
					['price', "Vous devez spécifier un prix (0 pour gratuit)"],
					['img', "Vous devez spécifier une URL d'image d'illustration"],
					['description', "Vous devez spécifier une description"],
					{field: 'files', file: true, error: "Vous devez envoyer des fichiers"},
				]
			}, function () {

				parseBody()

			})

		}
		else { // edit
			RequestManagerService.setRequest(req).setBody(data).setResponse(res).valid({
				"Tous les champs ne sont pas remplis.": [
					['name', "Vous devez spécifier un nom"],
					['price', "Vous devez spécifier un prix (0 pour gratuit)"],
					['img', "Vous devez spécifier une URL d'image d'illustration"],
					['description', "Vous devez spécifier une description"]
				]
			}, function () {

				// get id
				if (req.param('id') === undefined) {
					return res.notFound('ID is missing')
				}
				var id = req.param('id')

				// If theme exist
				Theme.findOne({id: id, state:'CONFIRMED'}).exec(function (err, theme) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					if (theme === undefined)
						return res.notFound()

					// if not author
					if (theme.author !== req.session.userId)
						return res.forbidden()

					parseBody(theme)

				})
			})
		}

    function parseBody(plugin) {
      var requirements = {};

      for (i in data.supported) {
        requirements[data.supported[i].type] = data.supported[i].operator + ' ' + data.supported[i].version
      }
      if (!add) {
        for (i in plugin.versions) {
          for (index in data.versions) {
            if (data.versions[index].version == plugin.versions[i].version) {
              plugin.versions[index].changelog['fr_FR'] = data.versions[index].changelog
              break;
            }
          }
        }
      }

      if (add)
        saveTheme(requirements)
      else
        updateTheme(plugin, requirements)
    }

		function updateTheme(theme, supported) {
			Theme.update({id: theme.id}, {
				name: data.name,
				price: data.price,
				img: data.img,
				description: data.description,
				supported: supported,
				versions: theme.versions
			}).exec(function (err, themeUpdated) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				// Notification
				NotificationService.success(req, req.__('Vous avez bien modifié votre thème !'))

				// render
				res.json({
					status: true,
					msg: req.__('Vous avez bien modifié votre thème !'),
					inputs:{}
				})

			})
		}
		function saveTheme(supported) {

			// try to upload files
			req.file("files").upload({

	       saveAs: function (file, cb) { // Check extension & content-type

	          var extension = file.filename.split('.').pop()

	          // seperate allowed and disallowed file types
	          if ((file.headers['content-type'] !== 'application/zip' && file.headers['content-type'] !== 'application/x-zip-compressed' && file.headers['content-type'] !== 'application/octet-stream') || extension != 'zip') {
	            // don't save
							return res.json({
								status: false,
								msg: req.__("Vous avez tenté d'envoyer un fichier autre qu'une archive zip ou n'ayant pas la bonne extension."),
								inputs:{}
							})
	          }
						else {
	            // save
							var name = req.session.userId + '-' + slugify(req.body.name) + '.zip'
	            cb(null, path.join(__dirname, '../../', sails.config.developer.upload.folders.themes, name))
	          }

	       }

	    },function whenDone (err, file) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				 // save in db
				 Theme.create({
					 name: data.name,
					 price: data.price,
					 img: data.img,
					 description: data.description,
					 supported: supported,
					 versions: '[{"version":"1.0.0","public":false,"changelog":{"fr_FR":["Mise en place du thème"]},"releaseDate":null}]',
					 author: req.session.userId,
					 version: '1.0.0'
				 }).exec(function (err, themeCreated) {

					 if (err) {
						 sails.log.error(err)
						 return res.serverError()
					 }

					 // Pushbullet
					 PushbulletService.push('Nouveau thème à vérifier', RouteService.getBaseUrl() + '/admin/developer/theme/validate/' + themeCreated.id, 'Theme', themeCreated.id, [sails.config.pushbullet.principalEmail])

					 // Notification
					 NotificationService.success(req, req.__('Vous avez bien ajouté votre thème ! Il sera vérifié et validé sous peu.'))

					 // render
					 res.json({
						 status: true,
						 msg: req.__('Vous avez bien ajouté votre thème ! Il sera vérifié et validé sous peu.'),
						 inputs:{}
					 })

				 })

	    })

		}
	},

	updateThemePage: function (req, res) {
		// get id
		if (req.param('id') === undefined) {
			return res.notFound('ID is missing')
		}
		var id = req.param('id')

		Theme.findOne({id:id, state:'CONFIRMED'}).exec(function (err, theme) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			if (theme === undefined)
				return res.notFound()

			if (theme.author !== req.session.userId || !theme.versions[0].public)
				return res.forbidden()

			// render
			return res.render('developer/update_theme', {
				title: req.__('Ajouter une version à votre thème'),
				theme: theme
			})

		})
	},

	updateTheme: function (req, res) {
		// get id
		if (req.param('id') === undefined) {
			return res.notFound('ID is missing')
		}
		var id = req.param('id')

		if (req.body['versionChangelog[]'] !== undefined && typeof req.body['versionChangelog[]'] !== 'object')
			req.body['versionChangelog[]'] = [req.body['versionChangelog[]']]

		// check request
		RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis.": [
				['versionName', "Vous devez spécifier un nom de version"],
				['versionChangelog[]', 'Vous devez au moins ajouter 1 changement'],
				{
					field: 'versionChangelog[]',
					arrayValueNeedFilled: '0',
					error: 'Vous devez au moins ajouter 1 changement'
				},
				{field: 'files', file: true, error: "Vous devez envoyer des fichiers"}
			],
			"Votre nom de version est incorrect.": [
				{
					field: 'versionName',
					regex: /^(\d+\.)(\d+\.)(\*|\d+)$/g,
					error: 'Vous devez mettre une version au format X.X.X'
				}
			]
		}, function () {

			// find plugin
			Theme.findOne({id:id, state:'CONFIRMED'}).exec(function (err, theme) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				// not found
				if (theme === undefined)
					return res.notFound()

				// not author
				if (theme.author !== req.session.userId || !theme.versions[0].public)
					return res.forbidden()

				// add version
				theme.versions.unshift({
					version: req.body.versionName,
					public: false,
					changelog: {
						'fr_FR': req.body['versionChangelog[]']
					}
				})

				// try to upload files
				req.file("files").upload({

					 saveAs: function (file, cb) { // Check extension & content-type

							var extension = file.filename.split('.').pop()

							// seperate allowed and disallowed file types
							if ((file.headers['content-type'] !== 'application/zip' && file.headers['content-type'] !== 'application/x-zip-compressed' && file.headers['content-type'] !== 'application/octet-stream') || extension != 'zip') {
								// don't save
								return res.json({
									status: false,
									msg: req.__("Vous avez tenté d'envoyer un fichier autre qu'une archive zip ou n'ayant pas la bonne extension."),
									inputs:{}
								})
							}
							else {
								// save
								var name = req.session.userId + '-' + theme.slug + '-v' + req.body.versionName + '.zip'
								cb(null, path.join(__dirname, '../../', sails.config.developer.upload.folders.themes, name))
							}

					 }

				},function whenDone (err, file) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}


					// Save
					Theme.update({id: id}, {versions: theme.versions}).exec(function (err, themeUpdated) {

						if (err) {
							sails.log.error(err)
							return res.serverError()
						}

						// Pushbullet
						PushbulletService.push('Nouvelle version de thème à vérifier', RouteService.getBaseUrl() + '/admin/developer/theme/update/validate/' + id, 'Theme', id, [sails.config.pushbullet.principalEmail])

						// Notification
						NotificationService.success(req, req.__('Vous avez bien ajouté une nouvelle version à votre thème ! Elle sera vérifiée et validée sous peu.'))

						// render
						res.json({
							status: true,
							msg: req.__('Vous avez bien ajouté une nouvelle version à votre thème ! Elle sera vérifiée et validée sous peu.'),
							inputs:{}
						})

					})

				})

			})

		})
	},

	deleteTheme: function (req, res) {
		// get id
		if (req.param('id') === undefined) {
			return res.notFound('ID is missing')
		}
		var id = req.param('id')

		Theme.findOne({id: id, state:'CONFIRMED'}).exec(function (err, theme) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			if (theme === undefined)
				return res.notFound()

			if (theme.author !== req.session.userId)
				return res.forbidden()

			Theme.update({id: id}, {state:'DELETED'}).exec(function (err, themeUpdated) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				// Notification
				NotificationService.success(req, req.__('Vous avez bien supprimé votre thème !'))

				// redirect
				res.redirect('/developer')

			})

		})
	}

};
