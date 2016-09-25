/**
 * Admin/TicketController
 *
 * @description :: Server-side logic for managing support
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')

module.exports = {

  index: function (req, res) {

    async.parallel([

      // find pendingTickets
      function (callback) {
        Ticket.find({user: req.session.userId, state: {'!': 'CLOSED'}}).sort('id DESC').populate(['replies', 'user', 'supported']).exec(function (err, tickets) {
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
        Ticket.find({state: 'CLOSED'}).populate(['user']).sort('id desc').limit(5).exec(function (err, tickets) {
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
        Ticket.findOne({id: id}).sort('id DESC').populate(['user']).exec(function (err, ticket) {
          if (err) {
            return callback(err)
          }

          if (ticket === undefined)
            return callback()
          // md5 email for author
          ticket.user = User.addMd5Email(ticket.user)

          // category
          switch (ticket.category) {
            case 'GENERAL':
              ticket.category = req.__('Général')
              break;
            case 'SERVER':
              ticket.category = req.__('Serveur')
              break;
            case 'DEVELOPMENT':
              ticket.category = req.__('Développement')
              break;
            case 'SUGGESTION':
              ticket.category = req.__('Suggestion')
              break;
            case 'QUESTION':
              ticket.category = req.__('Question')
              break;
            default:
              ticket.category = req.__('Autre')

          }

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

  close: function (req, res) {

  },

  take: function (req, res) {

  },

  editCategory: function (req, res) {

  },

  editState: function (req, res) {

  }

}
