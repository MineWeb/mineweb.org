/**
 * Admin/TicketController
 *
 * @description :: Server-side logic for managing support
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')

module.exports = {

  find: function (req, res) {
    if (req.param('search') === undefined)
      return res.notFound()
    var search = req.param('search')

    async.parallel([
      // Search with title
      function (callback) {
        Ticket.find({
          title: {'like': '%' + search + '%'}
        }).exec(callback)
      },
      // Search with content
      function (callback) {
        TicketReply.find({
          content: {'like': '%' + search + '%'}
        }).populate(['ticket']).exec(callback)
      }
    ], function (err, results) {
      if (err) {
        console.error(err)
        return res.json({status: false, tickets: {}})
      }

      var tickets = {}
      for (var i = 0; i < results[0].length; i++) {
        tickets[results[0][i].id] = {
          id: results[0][i].id,
          title: results[0][i].title,
          lastUpdate: results[0][i].updatedAt
        }
      }
      for (var i = 0; i < results[1].length; i++) {
        tickets[results[1][i].ticket.id] = {
          id: results[1][i].ticket.id,
          title: results[1][i].ticket.title,
          lastUpdate: results[1][i].ticket.updatedAt
        }
      }

      return res.json({status: true, tickets: tickets})
    })
  },

  index: function (req, res) {

    async.parallel([

      // find pendingTickets
      function (callback) {
        Ticket.find({state: {'!': 'CLOSED'}}).sort('id DESC').populate(['replies', 'user', 'supported']).exec(function (err, tickets) {
					if (err) {
						return callback(err, null)
					}
					else {
						// handle last reply & category
						if (tickets !== undefined) {
							for (var i = 0; i < tickets.length; i++) {
                // md5 email for author
                tickets.user = User.addMd5Email(tickets[i].user)
                if (tickets.supported)
                  tickets.supported = User.addMd5Email(tickets[i].supported)
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

      // find closedTickets
      function (callback) {
        Ticket.find({state: 'CLOSED'}).populate(['user']).sort('closedDate desc').limit(5).exec(function (err, tickets) {
          if (tickets !== undefined) {
            for (var i = 0; i < tickets.length; i++) {
              // md5 email for author
              tickets.user = User.addMd5Email(tickets[i].user)
            }
          }
          callback(err, tickets)
        })
      }

    ], function (err, results) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      res.view('admin/support/index', {
        title: req.__('Support'),
        pendingTickets: results[0],
        closedTickets: results[1]
      })

    })
  },

  view: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    async.parallel([

      // find ticket
      function (callback) {
        Ticket.findOne({id: id}).sort('id DESC').populate(['user', 'license']).exec(function (err, ticket) {
          if (err) {
            return callback(err)
          }

          if (ticket === undefined)
            return callback()
          // md5 email for author
          ticket.user = User.addMd5Email(ticket.user)

          callback(undefined, ticket)
        })
      },

      // find replies
      function (callback) {
        TicketReply.find({ticket: id}).populate(['user']).exec(function (err, replies) {

          if (err) {
            return callback(err)
          }

          for (var i = 0; i < replies.length; i++) {
            replies[i].user = User.addMd5Email(replies[i].user)
          }

          callback(undefined, replies)

        })
      }

    ], function (err, results) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      if (results[0] === undefined)
        return res.notFound()

      // set replies
      results[0].replies = (results[1] !== undefined) ? results[1] : []
      // render
      res.view('admin/support/view', {
        title: results[0].title,
        ticket: results[0]
      })
    })
  },

  reply: function(req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    // Handle form values
		RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis.": [
				['reply', "Vous devez spécifier une réponse"],
			]
		}, function () {

      // find ticket with this id
      Ticket.findOne({id: id}).populate(['user']).exec(function (err, ticket) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        if (ticket === undefined)
          return res.notFound()

        // Check if no has replies
        TicketReply.findOne({ticket: ticket.id}).sort('id DESC').exec(function (err, lastReply) {
          if (err) {
            sails.log.error(err)
            return res.serverError()
          }

          if (lastReply !== undefined && lastReply.id != req.body.last_reply_id)
            return res.json({
              status: false,
              msg: req.__('Une nouvelle réponse a été ajoutée depuis que vous avez chargé la page. Rechargez-la, lisez la réponse et réessayez.'),
              inputs: {}
            })

          // add signature + hello
          var content = TicketReply.addSignature(req.body.reply, {username: res.locals.user.username, rolename:User.getRoleName(res.locals.user)}, ticket.user.lang)

          // Save
          TicketReply.create({user: req.session.userId, ticket: id, content: content}).exec(function (err, reply) {
            if (err) {
              sails.log.error(err)
              return res.serverError()
            }

            // Update state
            Ticket.update({id: ticket.id}, {state: 'WAITING_USER_RESPONSE'}).exec(function (err, ticketUpdated) {
              res.json({
                status: true,
                msg: req.__('Votre réponse a bien été ajoutée !'),
                inputs: {}
              })

              // remove pusbullet notification
              PushbulletService.delete('Ticket', ticket.id)

              // send notification to user
              MailService.send('support_new_staff_response', {
                url: RouteService.getBaseUrl() + '/support/view/' + ticket.id,
                username: ticket.user.username,
                ticketTitle: ticket.title,
              }, req.__('Réponse à votre ticket support'), ticket.user.email);
            })
          })
        })
      })
    })
  },

  close: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    Ticket.findOne({id: id}).populate(['user']).exec(function (err, ticket) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      if (ticket === undefined)
        return res.notFound()

      Ticket.update({id: id}, {state: 'CLOSED', closedDate: (new Date())}).exec(function (err, ticketUpdated) {

        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // send notification toastr
        NotificationService.success(req, req.__('Vous avez bien fermé le ticket !'))

        // redirect
        res.redirect('/admin/support/')

        // remove pusbullet notification
        PushbulletService.delete('Ticket', ticketUpdated[0].id)

        // send notification to user
        MailService.send('support_staff_close', {
          url: RouteService.getBaseUrl() + '/support/view/' + ticket.id,
          username: ticket.user.username,
          ticketTitle: ticket.title,
        }, req.__('Fermeture de votre ticket support'), ticket.user.email);

      })

    })
  },

  take: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    Ticket.update({id: id}, {supported: req.session.userId}).exec(function (err, ticketUpdated) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // send notification toastr
      NotificationService.success(req, req.__('Vous avez bien pris en charge le ticket !'))

      // redirect
      res.redirect('/admin/support/' + ticketUpdated[0].id)

      // remove pusbullet notification
      PushbulletService.delete('Ticket', ticketUpdated[0].id)

    })
  },

  untake: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    Ticket.update({id: id}, {supported: null}).exec(function (err, ticketUpdated) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // send notification toastr
      NotificationService.success(req, req.__('Vous ne prennez plus en charge le ticket !'))

      // redirect
      res.redirect('/admin/support/' + ticketUpdated[0].id)

      // remove pusbullet notification
      PushbulletService.delete('Ticket', ticketUpdated[0].id)

    })
  },

  editCategory: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    Ticket.update({id: id}, {category: req.body.category}).exec(function (err, ticketUpdated) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      res.send(200)

    })
  },

  editState: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    Ticket.update({id: id}, {state: req.body.state}).exec(function (err, ticketUpdated) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      res.send(200)

    })
  }

}
