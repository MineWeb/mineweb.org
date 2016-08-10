/**
 * MailService
 *
 * @description :: Server-side logic formanaging mails
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Services
 */

var mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_APIKEY, domain: process.env.MAILGUN_DOMAIN});
var pug			= require('pug');

module.exports = {

  /**
   * Send a mail to an user
   *
   * @required {String} emailAddress
   *   The email address of the recipient.
   * @required {String} firstName
   *   The first name of the recipient.
   */
  send: function (template, vars, title, target) {
		var html = pug.renderFile('./templates/' + template + '.pug', { globals: vars });

		var data = {
			from: 'Mineweb <no-reply@mineweb.org>',
			to: target,
			subject: title,
			text: html
		};

		mailgun.messages().send(data, function (error, body) {
			if (error)
				sails.log.error(error);
			else
				sails.log.info("Successfuly sended a mail from template " + template + " to " + target);
		});
	}
};