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
			HostingService.checkEnded()
    }
	},
	{
		interval : '*/1 * * * *',
		task : function () {
			// Clear tickets supports under 1 week without user response
			Ticket.find({state: 'WAITING_USER_RESPONSE'}).populate(['replies']).exec(function (err, tickets) {

				// For each
				async.forEach(tickets, function (ticket, next) {

					if (ticket.replies !== undefined && ticket.replies.length > 0) {
						// find last reply of the author
						var userReplies = _.where(ticket.replies, {user: ticket.user});
						var lastReply = userReplies[userReplies.length - 1]
						// check if date < 1 week
						var date = (new Date(lastReply.createdAt)).getTime()
						var oneWeekAgo = moment().subtract(1, 'week').format('x')

						if (date < oneWeekAgo) { // if reply date is more old than 1 week
							// close
							Ticket.update({id: ticket.id}, {state: 'CLOSED'}).exec(function (err, ticketUpdated) {
								if (err)
									sails.log.error(err)
							})

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
