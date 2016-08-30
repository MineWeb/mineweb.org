/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var reCAPTCHA = require('recaptcha2')
var moment = require('moment')
var async	= require('async')
var twoFactor = require('two-factor')

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
				inputs: {}
			})
		}

		RequestManagerService.setRequest(request).setResponse(response).valid({
			"Tous les champs ne sont pas remplis.": [
				['username', "Vous devez spécifier un nom d'utilisateur"],
				['password', 'Vous devez spécifier un mot de passe']
			]
		}, function () {

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
				User.findOne({username: request.body.username, password: User.hashPassword(request.body.password)}).populate('tokens', {where: {type: 'VALIDATION'}, limit: 1}).exec(function (err, user) {

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
						if(user.tokens.length > 0 && user.tokens[0].usedAt === null) {
							return response.json({
								status: false,
								msg: request.__("Vous devez avoir validé votre adresse email avant de pouvoir vous connecter à votre compte."),
								inputs: {}
							})
						}

						// On vérifie si la double auth est active
						if (user.twoFactorAuthKey !== undefined && user.twoFactorAuthKey !== null) {
							// On stocke l'user dans la session temporairement pour la vérification
							user.wantRemember = (request.body.remember_me !== undefined && request.body.remember_me)
							request.session.loginUser = user

							// On répond à l'user pour qu'il soit redirigé
							return response.json({
								status: true,
								msg: request.__("Vous vous êtes bien connecté !"),
								inputs: {},
								twoFactorAuth: true
							})
						}

						// On sauvegarde la session/on le connecte, on gère le cookie de remember
						request.session.userId = user.id

						if(request.body.remember_me !== undefined && request.body.remember_me) {

							// On créé l'entrée dans la table de remember
							var expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
							RememberTokens.create({user: user.id, expireAt: expire}).exec(function (err, token) {

								response.cookie('remember_me', {
									userId: token.user,
									token: token.token
								},
								{
									expires: expire, // +1 week
									signed: true
								});

								// On set la notification toastr
								NotificationService.success(request, request.__('Vous vous êtes bien connecté !'))

								// On lui envoie un message de succès
								response.json({
									status: true,
									msg: request.__("Vous vous êtes bien connecté !"),
									inputs: {}
								})

							})
						}
						else { // Pas de cookie de remember

							// On set la notification toastr
							NotificationService.success(request, request.__('Vous vous êtes bien connecté !'))

							// On lui envoie un message de succès
							response.json({
								status: true,
								msg: request.__("Vous vous êtes bien connecté !"),
								inputs: {}
							})

						}

						// On ajoute une connexion aux logs de connexions de l'utilisateur
						Log.create({action: 'LOGIN', ip: request.ip, data: {userId: user.id}, status: true, type: 'USER'}).exec(function (err, log) {

							if (err) {
								sails.log.error(err)
								return response.serverError()
							}

						});

					}

				})


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
		Action statique, affichage de la page
	*/

	loginPage: function(request, response) {
		response.locals.title = 'Se connecter ou s\'enregistrer'
		response.render('user/sign')
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
				inputs: {}
			})
		}

		RequestManagerService.setRequest(request).setResponse(response).valid({
			"Tous les champs ne sont pas remplis.": [
				['username', "Vous devez spécifier un nom d'utilisateur"],
				['email', 'Vous devez spécifier un email'],
				['password', 'Vous devez spécifier un mot de passe'],
				['password_confirmation', 'Vous devez confirmer votre mot de passe']
			],
			"Vous devez choisir un pseudo valide !": [
					{
					field: 'username',
					regex: "^([a-zA-Z0-9-_]{4,25})$",
					error: "Le pseudo doit être alphanumérique et entre 4 et 25 caractères."
				}
			],
			"Vous devez choisir un email valide !": [
				{
					field: 'email',
					regex: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
					error: "Cet email n'a pas un format valide."
				}
			],
			"Les mots de passes ne sont pas identiques !": [
				{
					field: 'password_confirmation',
					value: request.body.password,
					error: 'Le mot de passe doit être identique à celui fourni ci-dessus.'
				}
			]
		}, function () {

			// Vérifier le captcha
			recaptcha = new reCAPTCHA({
				siteKey: sails.config.recaptcha.siteKey,
				secretKey: sails.config.recaptcha.secretKey
			})

			recaptcha.validateRequest(request).then(function () {


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

						// Sauvegarde de l'user
						User.create({username: request.body.username, password: request.body.password, email: request.body.email, lang: request.acceptedLanguages[0], ip: request.ip}).exec(function (err, user) {

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
								MailService.send('confirm_email', {
									url: RouteService.getBaseUrl() + '/user/confirm-email/' + token.token,
									username: user.username,
									ip: user.ip
								}, request.__('Confirmation de votre email'), user.email);


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

		})

	},


	/*
		Action de confirmation d'email
		@params Token
	*/

	confirmEmail: function (request, response) {

		// On récupère le token de validation
		if (request.param('token') === undefined) {
			return response.notFound('Validation token is missing')
		}
		var key = request.param('token')

		// On cherche le token
		Token.findOne({token: key, type: 'VALIDATION', usedAt: null, usedLocation: null}).exec(function (err, data) {

			if (err) {
				sails.log.error(err)
        return response.serverError('An error occured on token select')
			}

			// Si on ne trouve pas le token
			if (data === undefined) {
				return response.notFound('Unknown validation token or already used')
			}

			// On passe le token en validé
			Token.update({id: data.id}, {usedAt: (new Date()), usedLocation: request.ip}).exec(function (err, data) {

				if (err) {
					sails.log.error(err)
	        return response.serverError('An error occured on token update')
				}

				// On sauvegarde la session/on le connecte
				request.session.userId = data[0].user

				// On set le flash message
				FlashService.success(request, request.__('Vous avez bien validé votre adresse email !'))

				// On redirige l'utilisateur sur son compte
				return response.redirect('/user/profile')


			})

		})

	},

	/*
		Action statique, affichage de la page
	*/

	lostPasswordPage: function(request, response) {
		response.locals.title = "J'ai perdu mon mot de passe"
		response.render('user/lost_password')
	},

	/*
		Action pour envoyer un mail avec un token de rénitialisation de mot de passe
		Doit être call en AJAX
		Data: [email]
	*/

	lostPassword: function (request, response) {
		// On vérifie qu'il ne soit pas déjà connecté
		if(request.session.authenticated !== undefined && request.session.authenticated === true) {
			return response.json({
				status: false,
				msg: request.__("Vous êtes déjà connecté !"),
				inputs: {}
			})
		}

		RequestManagerService.setRequest(request).setResponse(response).valid({
			"Tous les champs ne sont pas remplis.": [
				['email', 'Vous devez spécifier un nom email'],
			]
		}, function () {

			// On vérifie que l'email appartient à un utilisateur
			User.findOne({email: request.body.email}).exec(function (err, user) {

				if (err) {
					sails.log.error(err)
					return response.serverError()
				}

				// Si aucun utilisateur ne correspond
				if (user === undefined) {
					return response.json({
						status: false,
						msg: request.__("Aucun utilisateur ne correspond à ces informations"),
						inputs: {
							email: request.__("Vous devez spécifier l'email appartenant à votre compte")
						}
					})
				}

				// On génére le token
				Token.create({user: user.id, type: 'FORGOT'}).exec(function (err, token) {

					if (err) {
						sails.log.error(err)
						return response.serverError()
					}

					// Envoyer le message de succès en JSON
					response.json({
						status: true,
						msg: request.__("Un email de rénitilisation vous a été envoyé ! Cliquez sur le lien contenu dans celui-ci pour suivre les étapes de rénitilisation."),
						inputs: {}
					})

					// On envoie l'email
					MailService.send('reset_password', {
						url: RouteService.getBaseUrl() + '/user/reset-password/' + token.token,
						username: user.username,
						ip: user.ip
					}, request.__('Rénitialisation de votre mot de passe'), user.email);


				})


			})

		})

	},

	/*
		Action statique, affichage de la page
	*/

	resetPasswordPage: function(request, response) {
		response.locals.title = "Rénitiliser mon mot de passe"
		response.render('user/reset_password')
	},


	/*
		Action pour rénitialiser son mot de passe à partir d'un token de rénitialisation envoyé par email
		Doit être call en AJAX
		Data: [token, password, password_confirmation]
	*/

	resetPassword: function (request, response) {
		// On vérifie qu'il ne soit pas déjà connecté
		if(request.session.authenticated !== undefined && request.session.authenticated === true) {
			return response.json({
				status: false,
				msg: request.__("Vous êtes déjà connecté !"),
				inputs: {}
			})
		}

		RequestManagerService.setRequest(request).setResponse(response).valid({
			"Tous les champs ne sont pas remplis.": [
				['password', 'Vous devez spécifier un mot de passe'],
				['password_confirmation', 'Vous devez confirmer votre mot de passe']
			],
			"Les mots de passes ne sont pas identiques !": [
				{
					field: 'password_confirmation',
					value: request.body.password,
					error: 'Le mot de passe doit être identique à celui fourni ci-dessus.'
				}
			]
		}, function () {

			// Vérifie le token (expire au bout d'une heure)
			Token.findOne({
				token: request.body.token,
				type: 'FORGOT',
				usedAt: null,
				usedLocation: null,
				createdAt: {
					'>=': (new Date(Date.now() - (60 * 60 * 1000)))
				}
			}).exec(function (err, token) {

				if (err) {
					sails.log.error(err)
	        return response.serverError('An error occured on token select')
				}

				// Si on ne trouve pas le token
				if (token === undefined) {
					return response.json({
						status: false,
						msg: request.__("Le token utilisé n'est pas valide ou a déjà expiré"),
						inputs: {}
					})
				}

				// On update le mot de passe
				User.update({id: token.user}, {password: request.body.password}).exec(function (err, user) {

					if (err) {
						sails.log.error(err)
		        return response.serverError('An error occured on token select')
					}


					// On passe le token en utilisé
					Token.update({id: token.id}, {usedAt: (new Date()), usedLocation: request.ip}).exec(function (err, token) {
						if (err) {
							sails.log.error(err)
						}
					})

					// On envoie la réponse
					return response.json({
						status: true,
						msg: request.__("Vous avez bien éditer votre mot de passe ! Vous pouvez maintenant vous connecter !"),
						inputs: {}
					})

				})


			})

		})

	},

	/*
		Action affichant le profil avec les informations de l'utilisateur
		Authentification requise
	*/

	profile: function (request, response) {
		response.locals.title = request.__("Profil")

		moment.locale(request.acceptedLanguages[0])

		async.parallel([

			// On cherche l'utilisateur avec plus d'infos
			function (callback) {

				User.findOne({id: request.session.userId}).populate(['hostings', 'licenses', 'paypalPayments', 'dedipassPayments']).exec(function (err, user) {
					if (err)
						callback(err, null)
					else
						callback(null, user);
				})

			},

			// On cherche ses logs de connexions
			function (callback) {

				Log.find({data: '{"userId":'+request.session.userId+'}', action: 'LOGIN'}).limit(5).sort('createdAt DESC').exec(function (err, logs) {
					if (err)
						callback(err, null)
					else
						callback(null, logs);
				})

			}

		], function (err, results) {

			if (err) {
				sails.log.error(err);
				return response.serverError();
			}

			response.locals.user = results[0]
			response.locals.user.createdAt = moment(response.locals.user.createdAt).format('LL')
			response.locals.user.connectionLogs = results[1]

			response.render('./user/profile')

		})

	},

	/*
		Action modifiant l'email de l'utilisateur
		Data: [email]
		Authentification requise
	*/

	editEmail: function (request, response) {

		RequestManagerService.setRequest(request).setResponse(response).valid({
			"Tous les champs ne sont pas remplis.": [
				['email', 'Vous devez spécifier un email'],
			],
			"Vous devez choisir un email valide !": [
				{
					field: 'email',
					regex: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
					error: "Cet email n'a pas un format valide."
				}
			]
		}, function () {

			// On vérifie que l'email n'est pas déjà utilisé
			User.count({email: request.body.email}).exec(function (err, count) {

				if (err) {
	      	sails.log.error(err)
	        return response.serverError()
	      }

				// L'email est déjà utilisé
				if (count > 0) {
					return response.json({
						status: false,
						msg: request.__("L'email est déjà utilisé par un autre utilisateur !"),
						inputs: {
							email: request.__("Vous devez choisir un email différent")
						}
					})
				}

				// On modifie l'email
				User.update({id: response.locals.user.id}, {email: request.body.email}).exec(function (err, user) {

					if (err) {
		      	sails.log.error(err)
		        return response.serverError()
		      }

					// On envoie une réponse à l'utilisateur
					return response.json({
						status: true,
						msg: request.__("Votre email a bien été modifié !"),
						inputs: {}
					})

				})

			})

		})

	},

	/*
		Action modifiant le mot de passe de l'utilisateur
		Data: [password, password_confirmation]
		Authentification requise
	*/

	editPassword: function (request, response) {

		RequestManagerService.setRequest(request).setResponse(response).valid({
			"Tous les champs ne sont pas remplis.": [
				['password', 'Vous devez spécifier un mot de passe'],
				['password_confirmation', 'Vous devez confirmer votre mot de passe']
			],
			"Les mots de passes ne sont pas identiques !": [
				{
					field: 'password_confirmation',
					value: request.body.password,
					error: 'Le mot de passe doit être identique à celui fourni ci-dessus.'
				}
			]
		}, function () {

			// On modifie le password
			User.update({id: response.locals.user.id}, {password: request.body.password}).exec(function (err, user) {

				if (err) {
					sails.log.error(err)
					return response.serverError()
				}

				// On envoie une réponse à l'utilisateur
				return response.json({
					status: true,
					msg: request.__("Votre mot de passe a bien été modifié !"),
					inputs: {}
				})

			})

		})

	},

	/*
		Action passant la secret key de la double auth à null, redirigeant vers le profil
	*/

	disableTwoFactorAuthentification: function (request, response) {
		// On set la key à null
		User.update({id: response.locals.user.id}, {twoFactorAuthKey: null}).exec(function (err, user) {

			if (err) {
				sails.log.error(err)
				return response.serverError()
			}

			// On set une notification
			NotificationService.success(request, request.__('Vous avez désactivé la double authentification !'))

			// On envoie l'utilisateur sur son profil
			response.redirect('/user/profile')

		})

	},

	/*
		Action générant la secret key de la double auth, affichant le QRCode
	*/

	enableTwoFactorAuthentificationPage: function (request, response) {

		// On génére la clé secrète
		var secret = twoFactor.generate.key();

		// On la met temporairement dans la session, pour la sauvegarder après
		request.session.twoFactorAuthKey = secret

		// On génère le QRCode
		var code = twoFactor.generate.qrcode(secret, 'MineWeb.org - '+response.locals.user.username, {
    	type: 'svg',
		  sync: true
		});

		// On rend la view
		response.view('user/enable-two-factor-auth', {
			title: request.__('Activer la double authentification'),
			qrcode: code
		})

	},

	/*
		Action vérifiant le premier code de vérification, sauvegadant la clé de double auth (redirection vers le profil ensuite)
	*/

	enableTwoFactorAuthentification: function (request, response) {

		// On vérifie que la double auth ne soit pas déjà config
		if(response.locals.user.twoFactorAuthKey !== undefined && response.locals.user.twoFactorAuthKey !== null) {
			return response.json({
				status: false,
				msg: request.__("Vous avez déjà la double authentification d'activée !"),
				inputs: {}
			})
		}

		// On vérifie que le champ est rempli
		RequestManagerService.setRequest(request).setResponse(response).valid({
			"Tous les champs ne sont pas remplis.": [
				['code', "Vous devez rentrer le code de vérification"],
			]
		}, function () {

			// On set le secret selon ce qui a été enregistré
			var secret = request.session.twoFactorAuthKey

			// On vérifie que le code est valide
			if (!twoFactor.verify(request.body.code, secret)) {
				return response.json({
					status: false,
					msg: request.__("Le code entré est invalide"),
					inputs: {
						email: request.__("Veuillez entrer un code de vérification valide.")
					}
				})
			}

			// On sauvegarde la clé dans la db
			User.update({id: request.session.userId}, {twoFactorAuthKey: secret}).exec(function (err, user) {

				if (err) {
					sails.log.error(err)
					return response.serverError()
				}

				// On set la notification
				NotificationService.success(request, request.__('Vous avez bien activé la double authentification !'))

				// On envoie le message de succès pour qu'il soit redirigé
				return response.json({
					status: true,
					msg: request.__('Vous avez bien activé la double authentification !'),
					inputs: {}
				})

			})

		})


	},

	/*
		Action statique, affichage de la page
	*/

	loginTwoFactorAuthVerificationPage: function(request, response) {
		response.locals.title = 'Double authentification'
		response.render('user/login-verification-two-factor-auth')
	},

	/*
		Action vérifiant le code de double authentification et connectant l'utilisateur si valide
	*/
	loginTwoFactorAuthVerification: function (request, response) {

		if (request.session.loginUser === undefined || request.session.loginUser.length === 0) {
			return response.json({
				status: false,
				msg: request.__("Re-connectez-vous, votre session a expirée."),
				inputs: {}
			})
		}

		// On vérifie que le champ est rempli
		RequestManagerService.setRequest(request).setResponse(response).valid({
			"Tous les champs ne sont pas remplis.": [
				['code', "Vous devez rentrer le code de vérification"],
			]
		}, function () {

			// On set le secret selon ce qui a été enregistré
			var secret = request.session.loginUser.twoFactorAuthKey

			// On vérifie que le code est valide
			if (!twoFactor.verify(request.body.code, secret)) {
				return response.json({
					status: false,
					msg: request.__("Le code entré est invalide"),
					inputs: {
						email: request.__("Veuillez entrer un code de vérification valide.")
					}
				})
			}

			// On supprime l'utilisation temporairement de la session
			var user = request.session.loginUser
			request.session.loginUser = undefined

			// On sauvegarde la session/on le connecte, on gère le cookie de remember
			request.session.userId = user.id

			if (user.wantRemember) {

				// On créé l'entrée dans la table de remember
				var expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
				RememberTokens.create({user: user.id, expireAt: expire}).exec(function (err, token) {

					response.cookie('remember_me', {
						userId: token.user,
						token: token.token
					},
					{
						expires: expire, // +1 week
						signed: true
					});

					// On set la notification toastr
					NotificationService.success(request, request.__('Vous vous êtes bien connecté !'))

					// On lui envoie un message de succès
					response.json({
						status: true,
						msg: request.__("Vous vous êtes bien connecté !"),
						inputs: {}
					})

				})
			}
			else {

				// On set la notification toastr
				NotificationService.success(request, request.__('Vous vous êtes bien connecté !'))

				// On lui envoie un message de succès
				response.json({
					status: true,
					msg: request.__("Vous vous êtes bien connecté !"),
					inputs: {}
				})

			}

			// On ajoute une connexion aux logs de connexions de l'utilisateur
			Log.create({action: 'LOGIN', ip: request.ip, data: {userId: user.id}, status: true, type: 'USER'}).exec(function (err, log) {

				if (err) {
					sails.log.error(err)
					return response.serverError()
				}

			});


		})


	}

};
