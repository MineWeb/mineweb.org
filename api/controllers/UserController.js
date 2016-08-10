/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

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

						// on renvoie le json
						return response.json({
							status: false,
							msg: request.__("Aucun utilisateur ne correspond à ces identifiants."),
							inputs: {}
						})

					});

				} else {


					// On vérifie que l'email de l'account est bien confirmé
					if(user.tokens.length > 0 && user.tokens[0].usedAt === undefined) {
						return response.json({
							status: false,
							msg: request.__("Vous devez avoir validé votre adresse email avant de pouvoir vous connecter à votre compte."),
							inputs: {}
						})
					}

					// On ajoute une connexion aux logs de connexions de l'utilisateur
					Log.create({action: 'LOGIN', ip: request.ip, status: true, type: 'USER'}).exec(function (err, log) {

						if (err) {
							sails.log.error(err)
							return response.serverError()
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
						return response.json({
							status: true,
							msg: request.__("Vous vous êtes bien connecté !"),
							inputs: {}
						})

					});

				}

			})


		})


	},


	/*
		Action de déconnexion, aucune vue d'affiché
	*/

	logout: function(request, response) {

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

	}

};
