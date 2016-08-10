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

						// On sauvegarde le cookie, on le connecte, on gère le cookie de remember TODO

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


	}

};
