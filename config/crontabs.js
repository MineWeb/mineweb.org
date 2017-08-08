/**
 * Scheduler
 *
 * @description :: Scheduler for background task
 */

var async = require('async')
var _ = require('underscore')
var moment = require('moment')

module.exports.crontabs = [
	{
    interval : '0 12 * * *',
    task : function () {
			//HostingService.checkEnded()
    }
	},
	{
		interval : '0 * * * *',
		task : function () {
			sails.log.info('Check support tickets...')
			// Clear tickets supports under 1 week without user response
			Ticket.find({state: 'WAITING_USER_RESPONSE'}).populate(['replies', 'user']).exec(function (err, tickets) {

				// For each
				async.forEach(tickets, function (ticket, next) {

					if (ticket.replies !== undefined && ticket.replies.length > 0) {
						// find last reply of the author
						var userReplies = _.where(ticket.replies, {user: ticket.user.id});
						var lastReply = userReplies[userReplies.length - 1]
						if (lastReply !== undefined) {
							// check if date < 1 week
							var date = (new Date(lastReply.createdAt)).getTime()
							var oneWeekAgo = moment().subtract(4, 'day').format('x')

							if (date < oneWeekAgo) { // if reply date is more old than 1 week
								// close
								Ticket.update({id: ticket.id}, {state: 'CLOSED', closedDate: (new Date())}).exec(function (err, ticketUpdated) {
									if (err)
										sails.log.error(err)

									// send notification
									MailService.send('support_auto_close', {
					          url: RouteService.getBaseUrl() + '/support/view/' + ticket.id,
					          username: ticket.user.username,
					          ticketTitle: ticket.title,
					        }, sails.__('Fermeture automatique de votre ticket support'), ticket.user.email);
								})

							}
						}
					}

					next()

				}, function () {
					return true
				})

			})
		}
	}
];
