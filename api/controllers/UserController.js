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
		if (request.body.username !== undefined && request.body.username.length > 0 && request.body.password !== undefined && request.body.password.length > 0) {

			// On vérifie que l'ip n'est pas bloquée à cause de l'anti-bruteforce

				// On vérifie qu'un utilisateur existe avec cet combinaison d'identifiants

					// On vérifie que l'email de l'account est bien confirmé

						// On ajoute une connexion aux logs de connexions de l'utilisateur

							// On sauvegarde le cookie, on le connecte, on gère le cookie de remember

								// On lui envoie un message de succès
		} else {
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
				response.json({
					status: false,
					msg: request.__("Tous les champs ne sont pas remplis."),
					inputs: inputs
				})
		}

	}

};
