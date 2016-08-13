/**
 * MailService
 *
 * @description :: Server-side logic formanaging mails
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Services
 */

var mailgun = require('mailgun-js')({apiKey: sails.config.mailgun.apiKey, domain: sails.config.mailgun.domain});
var pug			= require('pug');
var path    = require('path');


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
    var template_path = path.join(__dirname, '../../views/emails/')
    vars.title = title
    vars.sails = sails
		var html = pug.renderFile(template_path + template + '.pug', vars)

		var data = {
			from: 'MineWeb <no-reply@mineweb.org>',
			to: target,
			subject: title,
			html: html
		}

		mailgun.messages().send(data, function (error, body) {
			if (error)
				sails.log.error(error);
			else
				sails.log.info("Successfuly sended a mail from template " + template + " to " + target)
		});
	}
};
