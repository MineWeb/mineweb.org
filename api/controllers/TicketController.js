/**
 * TicketController
 *
 * @description :: Server-side logic for managing Tickets
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')

module.exports = {

	/*
		DISPLAY SUPPORT INDEX
	*/
	index: function (req, res) {

		async.parallel([

			// Find opened tickets
			function (callback) {
				Ticket.find({user: req.session.userId, state: {'!': 'CLOSED'}}).sort('id DESC').populate(['replies']).exec(function (err, tickets) {
					if (err) {
						return callback(err, null)
					}
					else {

						// handle last reply & category
						if (tickets !== undefined) {
							for (var i = 0; i < tickets.length; i++) {
								// get last activity
								var id = tickets[i].replies.length - 1
								tickets[i].lastReply = tickets[i].replies[id]
								// category
								switch (tickets[i].category) {
									case 'GENERAL':
										tickets[i].category = req.__('Général')
										break;
									case 'SERVER':
										tickets[i].category = req.__('Serveur')
										break;
									case 'DEVELOPMENT':
										tickets[i].category = req.__('Développement')
										break;
									case 'SUGGESTION':
										tickets[i].category = req.__('Suggestion')
										break;
									case 'QUESTION':
										tickets[i].category = req.__('Question')
										break;
									default:
										tickets[i].category = req.__('Autre')

									}
							}
						}

						return callback(null, tickets)
					}
				})
			},

			// Find closed tickets
			function (callback) {
				Ticket.find({user: req.session.userId, state: 'CLOSED'}).sort('closedDate DESC').populate(['replies']).exec(function (err, tickets) {
					if (err) {
						return callback(err, null)
					}
					else {

						// handle last reply & category
						if (tickets !== undefined) {
							for (var i = 0; i < tickets.length; i++) {
								// get last activity
								var id = tickets[i].replies.length - 1
								tickets[i].lastReply = tickets[i].replies[id]
								// category
								switch (tickets[i].category) {
									case 'GENERAL':
										tickets[i].category = req.__('Général')
										break;
									case 'SERVER':
										tickets[i].category = req.__('Serveur')
										break;
									case 'DEVELOPMENT':
										tickets[i].category = req.__('Développement')
										break;
									case 'SUGGESTION':
										tickets[i].category = req.__('Suggestion')
										break;
									case 'QUESTION':
										tickets[i].category = req.__('Question')
										break;
									default:
										tickets[i].category = req.__('Autre')

								}
							}
						}

						return callback(null, tickets)
					}
				})
			}

		], function (err, results) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			return res.view('support/index', {
				title: req.__('Support'),
				openTickets: results[0],
				closedTickets: results[1]
			})

		})

	},

	/*
		DISPLAY NEW TICKET PAGE
	*/
	newPage: function (req, res) {
		async.parallel([

			// Find licenses
			function (callback) {
				License.find({user:req.session.userId}).exec(function (err, licenses) {
					if (err)
						callback(err, null)
					else
						callback(null, licenses)
				})
			},

			// Find hostings
			function (callback) {
				Hosting.find({user:req.session.userId}).exec(function (err, hostings) {
					if (err)
						callback(err, null)
					else
						callback(null, hostings)
				})
			}

		], function(err, results) {

			// if sql error
			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			// render
			return res.view('support/add', {
				title: req.__('Ouvrir un ticket'),
				licenses: results[0],
				hostings: results[1]
			})

		})
	},

	/*
		(POST) ADD NEW TICKET
	*/
	new: function (req, res) {

		// Handle form values
		RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis.": [
				['title', "Vous devez spécifier un titre"],
				['category', 'Vous devez spécifier une catégorie'],
				['content', 'Vous devez spécifier un contenu']
			]
		}, function () {

			// Handle title and category
			RequestManagerService.setRequest(req).setResponse(res).valid({
				"Vous n'avez pas respecté certaines règles": [
					{
						field: 'title',
						max: 20,
						error: "Votre titre doit faire au maximum 20 caractères"
					},
					{
						field: 'category',
						in: ['GENERAL', 'SERVER', 'DEVELOPMENT', 'SUGGESTION', 'QUESTION', 'OTHER'],
						error: "La catégorie sélectionnée est inconnue"
					}
				]
			}, function () {

				// Handle ticket data
				var data = {
					title: req.body.title,
					category: req.body.category,
					user: req.session.userId
				}

				// Handle License/Hosting
				if (req.body.license_hosting !== undefined && req.body.license_hosting !== null && req.body.license_hosting.length > 0) {
					var splited = req.body.license_hosting.split(':')
					if (splited[0] === 'LICENSE')
						data.license = splited[1]
					else if (splited[0] === 'HOSTING')
						data.hosting = splited[1]
				}

				// Save
				Ticket.create(data).exec(function (err, ticket) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					// Save reply
					TicketReplies.create({user: data.user, ticket: ticket.id, content: req.body.content}).exec(function (err, reply) {

						if (err) {
							sails.log.error(err)
							return res.serverError()
						}

						// send notification toastr
						NotificationService.success(req, req.__('Vous avez bien ouvert un ticket !'))

						// send response
						res.json({
							status: true,
							msg: req.__("Vous avez bien ouvert un ticket !"),
							data: {
								id: ticket.id
							}
						})

					})

				})


			})

		})
	},

	/*
		DISPLAY TICKET PAGE
	*/
	view: function (req, res) {
		// handle param
		if (req.param('id') === undefined)
			return res.notFound()

		// Find ticket
		Ticket.findOne({id: req.param('id')}).populate(['replies']).exec(function (err, ticket) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			// not found
			if (ticket === undefined)
				return res.notFound()

			// handle authors
			var users = {}
			async.forEach(ticket.replies, function (reply, callback) {

				User.findOne({id: reply.user}).exec(function (err, user) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					if (user !== undefined)
						users[user.id] = User.addMd5Email(user)

					callback()

				})

			}, function() {

				// render
				return res.view('support/view', {
					title: ticket.title,
					ticket: ticket,
					users: users
				})

			})

		})
	},

	/*
		(POST) REPLY TO A TICKET
	*/
	reply: function (req, res) {

		// Handle form values
		RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis.": [
				['content', 'Vous devez spécifier un contenu']
			]
		}, function () {

			// handle param
			if (req.param('id') === undefined)
				return res.notFound()

			// Find ticket
			Ticket.findOne({id: req.param('id')}).exec(function (err, ticket) {

				if (err) {
					sails.log.error(err)
					return res.serverError()
				}

				// check if author
				if (req.session.userId === ticket.user) {

					// save
					TicketReplies.create({user: req.session.userId, content: req.body.content, ticket: ticket.id}).exec(function (err, reply) {

						if (err) {
							sails.log.error(err)
							return res.serverError()
						}

						// send response
						res.json({
							status: true,
							msg: req.__("Vous avez bien répondu au ticket !"),
							data: {
								createdAt: reply.createdAt,
								content: reply.content
							}
						})

					})

				}
				else {
					return res.forbidden()
				}

			})

		})
	},

	/*
		CLOSE A TICKET
	*/
	close: function (req, res) {
		// handle param
		if (req.param('id') === undefined)
			return res.notFound()

		// Find ticket
		Ticket.findOne({id: req.param('id')}).exec(function (err, ticket) {

			if (err) {
				sails.log.error(err)
				return res.serverError()
			}

			// check if author
			if (req.session.userId === ticket.user) {
				Ticket.update({id: ticket.id}, {state: 'CLOSED', closedDate: (new Date())}).exec(function (err, ticket) {

					if (err) {
						sails.log.error(err)
						return res.serverError()
					}

					// send notification toastr
					NotificationService.success(req, req.__('Vous avez bien fermé le ticket !'))

					// redirect
					res.redirect('/support')

				})
			}
			else {
				return res.forbidden()
			}

		})
	}

};
