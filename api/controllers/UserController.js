/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var reCAPTCHA = require('recaptcha2')
var mailgun = require('mailgun-js')({apiKey: 'key-f9a20bc3fd43f45cd70e6dd6a6257c53', domain: 'mineweb.org'});

module.exports = {

	/*
		Action de connexion, doit être call en ajax
	*/

	login: function (request, response) {

		// On vérifie qu'il ne soit pas déjà connecté
		if(request.session.authenticated !== undefined && request.session.authenticated === true) {
			return response.json({
				status: false,
				msg: request.__("Vous êtes déjà connecté !"),
				inputs: inputs
			})
		}

		// On vérifie que les champs ne soient pas vides
		if (request.body.username === undefined || request.body.username.length === 0 || request.body.password === undefined || request.body.password.length === 0) {
			// Il manque des champs.

				// On gère la validation html
				var inputs = {}

				if (request.body.username === undefined || request.body.username.length === 0) {
					inputs.username = request.__("Vous devez spécifier un nom d'utilisateur")
				}
				if (request.body.password === undefined || request.body.password.length === 0) {
					inputs.password = request.__("Vous devez spécifier un mot de passe")
				}

				// On envoie le json en réponse
				return response.json({
					status: false,
					msg: request.__("Tous les champs ne sont pas remplis."),
					inputs: inputs
				})
		}

		// On vérifie que l'ip n'est pas bloquée à cause de l'anti-bruteforce
		Log.count({
			action: 'TRY_LOGIN',
			ip: request.ip,
			createdAt: {
				'>=': (new Date(Date.now() - (60 * 60 * 1000)))
			}
		}).exec(function (err, retries) {

			if (err) {
      	sails.log.error(err)
        return response.serverError()
      }

			if(retries >= 10) {
				// Bloqué par l'anti-bruteforce
				return response.json({
					status: false,
					msg: request.__("Vous êtes temporairement bloqué ! Vous avez essayé trop de fois le mauvais mot de passe."),
					inputs: {}
				})
			}

			// On vérifie qu'un utilisateur existe avec cet combinaison d'identifiants
			User.findOne({username: request.body.username, password: request.body.password}).populate('tokens', {where: {type: 'VALIDATION'}, limit: 1}).exec(function (err, user) {

				if (err) {
	      	sails.log.error(err)
	        return response.serverError()
	      }

				if (user === undefined) {
					// Utilisateur inconnu

					// on stocke dans les logs
					Log.create({action: 'TRY_LOGIN', ip: request.ip, status: false, error: 'Invalid credentials', type: 'USER'}).exec(function (err, log) {

						if (err) {
			      	sails.log.error(err)
			        return response.serverError()
			      }

					});

					// on renvoie le json
					return response.json({
						status: false,
						msg: request.__("Aucun utilisateur ne correspond à ces identifiants."),
						inputs: {}
					})


				} else {


					// On vérifie que l'email de l'account est bien confirmé
					if(user.tokens.length > 0 && user.tokens[0].usedAt === undefined) {
						return response.json({
							status: false,
							msg: request.__("Vous devez avoir validé votre adresse email avant de pouvoir vous connecter à votre compte."),
							inputs: {}
						})
					}

					// On sauvegarde la session/on le connecte, on gère le cookie de remember
					request.session.userId = user.id

					if(request.body.remember_me !== undefined && request.body.remember_me) {
						response.cookie('remember_me', {
							username: user.username,
							password: user.password
						},
						{
							expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 10000), // +1 week
							signed: true
						});
					}

					// On lui envoie un message de succès
					response.json({
						status: true,
						msg: request.__("Vous vous êtes bien connecté !"),
						inputs: {}
					})

					// On ajoute une connexion aux logs de connexions de l'utilisateur
					Log.create({action: 'LOGIN', ip: request.ip, status: true, type: 'USER'}).exec(function (err, log) {

						if (err) {
							sails.log.error(err)
							return response.serverError()
						}

					});

				}

			})


		})


	},


	/*
		Action de déconnexion, aucune vue d'affiché
	*/

	logout: function (request, response) {

		// On clear le cookie de remember
		response.clearCookie('remember_me')

		// On supprime les infos dans la session
		request.session.destroy(function (err) {

			if (err) {
      	sails.log.error(err)
        return response.serverError()
      }

      return response.redirect('/login')

    });

	},


	/*
		Action d'inscription, doit être call en ajax
	*/

	signup: function (request, response) {

		// Vérifier qu'il est pas déjà connecté
		if(request.session.authenticated !== undefined && request.session.authenticated === true) {
			return response.json({
				status: false,
				msg: request.__("Vous êtes déjà connecté !"),
				inputs: inputs
			})
		}

		// Vérifier que tous les champs soient remplis
		if (request.body.username === undefined || request.body.username.length === 0 || request.body.email === undefined || request.body.email.length === 0 || request.body.password === undefined || request.body.password.length === 0 || request.body.password_confirmation === undefined || request.body.password_confirmation.length === 0) {
			// Il manque des champs.

				// On gère la validation html
				var inputs = {}

				if (request.body.username === undefined || request.body.username.length === 0) {
					inputs.username = request.__("Vous devez spécifier un nom d'utilisateur")
				}
				if (request.body.email === undefined || request.body.email.length === 0) {
					inputs.email = request.__("Vous devez spécifier un email")
				}
				if (request.body.password === undefined || request.body.password.length === 0) {
					inputs.password = request.__("Vous devez spécifier un mot de passe")
				}
				if (request.body.password_confirmation === undefined || request.body.password_confirmation.length === 0) {
					inputs.password_confirmation = request.__("Vous devez confirmer votre mot de passe")
				}

				// On envoie le json en réponse
				return response.json({
					status: false,
					msg: request.__("Tous les champs ne sont pas remplis."),
					inputs: inputs
				})
		}

		// Vérifier le captcha
		recaptcha = new reCAPTCHA({
			siteKey: sails.config.recaptcha.siteKey,
			secretKey: sails.config.recaptcha.secretKey
		})

		recaptcha.validateRequest(request).then(function () {

			// Vérifier que le pseudo soit valide

			if (!(new RegExp("^([a-zA-Z0-9-_]{4,25})$").test(request.body.username))) {
				return response.json({
					status: false,
					msg: request.__("Vous devez choisir un pseudo valide !"),
					inputs: {
						username: request.__("Le pseudo doit être alphanumérique et entre 3 et 25 caractères.")
					}
				})
			}

			User.count({username: request.body.username}).exec(function (err, count) {

				if (err) {
	      	sails.log.error(err)
	        return response.serverError()
	      }

				// Pseudo déjà utilisé
				if (count > 0) {
					return response.json({
						status: false,
						msg: request.__("Vous devez choisir un pseudo non utilisé !"),
						inputs: {
							username: request.__("Cet pseudo est déjà utilisé.")
						}
					})
				}

				// Vérifier que l'email soit valide
				if (!(new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).test(request.body.email))) {
					return response.json({
						status: false,
						msg: request.__("Vous devez choisir un email valide !"),
						inputs: {
							email: request.__("Cet email n'a pas un format valide.")
						}
					})
				}

				User.count({email: request.body.email}).exec(function (err, count) {

					if (err) {
		      	sails.log.error(err)
		        return response.serverError()
		      }

					// Pseudo déjà utilisé
					if (count > 0) {
						return response.json({
							status: false,
							msg: request.__("Vous devez choisir un email non utilisé !"),
							inputs: {
								email: request.__("Cet email est déjà utilisé.")
							}
						})
					}

					// Vérifier que les mots de passes sont identiques
					if (request.body.password !== request.body.password_confirmation) {
						return response.json({
							status: false,
							msg: request.__("Les mots de passes ne sont pas identiques !"),
							inputs: {
								password_confirmation: request.__("Le mot de passe doit être identique à celui fourni ci-dessus.")
							}
						})
					}

					// Sauvegarde de l'user
					User.create({username: request.body.username, password: request.body.password, email: request.body.email, lang: request.acceptedLanguages[0]}).exec(function (err, user) {

						if (err) {
			      	sails.log.error(err)
			        return response.serverError()
			      }

						// Sauvegarde du token de validation, envoie de l'email de confirmation
						Token.create({user: user.id, type: 'VALIDATION'}).exec(function (err, token) {

							if (err) {
								sails.log.error(err)
								return response.serverError()
							}

							// Envoyer le message de succès en JSON
							response.json({
								status: true,
								msg: request.__("Vous vous êtes bien inscrit ! Vous devez maintenant confirmer votre email pour pouvoir vous connecter."),
								inputs: {}
							})

							// On envoie l'email de confirmation
							MailService.send('confirm_email', { url: RouteService.getBaseUrl() + '/user/confirm-email/' + token.token }, request.__('Confirmation de votre email'), user.email);


						})

					})

				})

			})

		}).catch(function (errorCodes) {
			// invalid
			return response.json({
				status: false,
				msg: request.__("Veuillez valider la sécurité anti-robots"),
				inputs: {
					captcha_msg: request.__("Vous devez prouver que vous êtes un humain en validant l'étape ci-dessus")
				}
			})
		})

	},


	/*
		Action de confirmation d'email
		@params Token
	*/

	confirmEmail: function(request, response) {

		// On récupère le token de validation
		if (request.param('token') === undefined) {
			return response.notFound('Validation token is missing')
		}
		var token = request.param('token')

		// On cherche le token
		Token.findOne({token: token, type: 'VALIDATION', usedAt: undefined, usedLocation: undefined}).exec(function (err, token) {

			if (err) {
				sails.log.error(err)
        return response.serverError('An error occured on token select')
			}

			// Si on ne trouve pas le token
			if (token === undefined) {
				return response.notFound('Unknown validation token')
			}

			// On passe le token en validé
			Token.update({id: token.id}, {usedAt: Date.now(), usedLocation: request.ip}).exec(function (err, token) {

				if (err) {
					sails.log.error(err)
	        return response.serverError('An error occured on token update')
				}

				// On redirige l'utilisateur sur son compte
				return response.redirect('/user/profile')


			})

		})

	}

};
