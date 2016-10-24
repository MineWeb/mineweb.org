/**
 * MailService
 *
 * @description :: Server-side logic formanaging mails
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Services
 */

if (sails.config.mail.api === 'mailgun')
  var mailgun = require('mailgun-js')({apiKey: sails.config.mail.mailgun.apiKey, domain: sails.config.mail.mailgun.domain})
else
  var sendgrid  = require('sendgrid')(sails.config.mail.sendgrid.apiKey)
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

    if (sails.config.mail.api === 'sendgrid')
      sendgrid.send({
        to:       target,
        from:     'no-reply@mineweb.org',
        fromname: 'MineWeb',
        subject:  title + ' | MineWeb',
        html:     html
      }, function(err, json) {
        if (err) return sails.log.error(err)
        sails.log.info("Successfuly sended a mail from template " + template + " to " + target)
      })
    else
      mailgun.messages().send(
      {
        from: 'MineWeb <no-reply@mineweb.org>',
        to: target,
        subject: title + ' | MineWeb',
        html: html
      }, function (error, body) {
        if (error)
          sails.log.error(error);
        else
          sails.log.info("Successfuly sended a mail from template " + template + " to " + target)
      })
  }
}
