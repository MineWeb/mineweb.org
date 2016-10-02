/**
 * Admin/HostingsController
 *
 * @description :: Server-side logic for search hosting/hosting
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')
var request = require('request')

module.exports = {

  getHost: function (hosting) {
    if (hosting.hostType === 'SUBDOMAIN')
      return 'http://' + hosting.host +  '.craftwb.fr'
    else
      return 'http://' + hosting.host
  },

  find: function (req, res) {
    // handle 'user' field
    var user
    if (req.body.user == parseInt(req.body.user)) { // is id
      var user = req.body.user
      next()
    }
    else if (req.body.user !== undefined & req.body.user.length > 0) { // find user
      User.findOne({or: {username: req.body.user, email: req.body.user}}).exec(function (err, userFinded) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }
        if (userFinded !== undefined)
          user = userFinded.id
        next()
      })
    }
    else {
      next()
    }

    function next () {
      // handle conditions
      var conditions = {}
      if (user !== undefined && user.length > 0)
        conditions.user = user
      if (req.body.key !== undefined && req.body.key.length > 0)
        conditions.key = req.body.key
      if (req.body.host !== undefined && req.body.host.length > 0)
        conditions.host = req.body.host
      if (req.body.purchase !== undefined && req.body.purchase.length > 0)
        conditions.purchase = req.body.purchase
      if (req.body.id !== undefined && req.body.id.length > 0)
        conditions.id = req.body.id

      if (Object.keys(conditions).length === 0) {
        return res.json({
          status: false,
          msg: req.__('Vous devez au moins remplir un critère.'),
          inputs: {}
        })
      }

      // search
      Hosting.findOne(conditions).exec(function (err, hosting) {

        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        if (hosting === undefined) {
          return res.json({
            status: false,
            msg: req.__('Aucune hébergement trouvé avec les informations fournies.'),
            inputs: {}
          })
        }

        return res.json({
          status: true,
          msg: req.__('Un hébergement a été trouvé ! Redirection en cours...'),
          inputs: {},
          data: {
            hosting: {
              id: hosting.id
            }
          }
        })

      })
    }
  },

  view: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    var self = this

    // find
    Hosting.findOne({id: id}).populate(['user', 'purchase']).exec(function (err, hosting) {

      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (hosting === undefined)
        return res.notFound()

      // handle host
      hosting.host = self.getHost(hosting)

      var payment = undefined

      // if purchase type is paypal/dedipass, find payment
      if (hosting.purchase.paymentType === 'PAYPAL' || hosting.purchase.paymentType === 'DEDIPASS') {
        var model = (hosting.purchase.paymentType === 'PAYPAL') ? PayPalHistory : DedipassHistory
        model.findOne({purchase: hosting.purchase.id}).exec(function (err, purchasePayment) {
          if (err) {
            sails.log.error(err)
            return res.serverError()
          }
          payment = purchasePayment
          render()
        })
      }
      else {
        render()
      }

      // render
      function render() {

        res.view('admin/hosting/view', {
          title: req.__("Détails d'une hébergement"),
          payment: payment,
          hosting: hosting,
          lastCheckDate: (Date.now() - 60 * 60 * 60), // TODO
          apiLogs: [ // TODO
            {
              apiVersion: 2,
              action: 'CHECK',
              date: new Date(Date.now()),
              status: true,
              data: '{"id":1,"key":"f87f-e655-1c2a-57ef-e6bc","domain":"http://update.craftwb.fr"}'
            },
            {
              apiVersion: 1,
              action: 'GET_SECRET_KEY',
              date: new Date(Date.now()),
              status: false,
              errorMessage: 'Unknown hosting',
              data: '{"id":10,"key":"f87f-e655-1c2a-57ef-e6bc","domain":"http://custom.tld"}'
            }
          ]
        })

      }

    })

  },

  suspend: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')
    // get reason
    if (req.param('reason') === undefined) {
			return res.notFound('Reason is missing')
		}
		var reason = req.param('reason')

    var self = this

    // find
    Hosting.findOne({id: id}).populate(['user']).exec(function (err, hosting) {

      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (hosting === undefined)
        return res.notFound()

      // handle host
      hosting.host = self.getHost(hosting)

      // update db
      Hosting.update({id: hosting.id}, {suspended: reason, state: false}).exec(function (err, hostingUpdated) {
        // error
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // send notification toastr
        NotificationService.success(req, req.__("Vous avez bien suspendu l'hébergement !"))

        // redirect
        res.redirect('/admin/hosting/view/' + hosting.id)

        // send notification to user
        MailService.send('licence_suspended', {
          username: hosting.user.username,
          reason: reason,
          licenseId: hosting.id,
          licenseHost: hosting.host
        }, req.__('Suspension de votre licence'), hosting.user.email)

      })

    })
  },

  unsuspend: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    var self = this

    // find
    Hosting.findOne({id: id}).populate(['user']).exec(function (err, hosting) {

      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (hosting === undefined)
        return res.notFound()

      // handle host
      hosting.host = self.getHost(hosting)

      // update db
      Hosting.update({id: hosting.id}, {suspended: null, state: true}).exec(function (err, hostingUpdated) {
        // error
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // send notification toastr
        NotificationService.success(req, req.__("Vous avez bien réactiver l'hébergement !"))

        // redirect
        res.redirect('/admin/hosting/view/' + hosting.id)

        // send notification to user
        MailService.send('licence_unsuspended', {
          username: hosting.user.username,
          reason: hosting.suspended,
          licenseId: hosting.id,
          licenseHost: hosting.host
        }, req.__('Réactivation de votre licence'), hosting.user.email)

      })

    })
  },

  getDebug: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    var self = this

    // find
    Hosting.findOne({id: id}).exec(function (err, hosting) {

      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (hosting === undefined)
        return res.notFound()

      // handle host
      hosting.host = self.getHost(hosting)

      // request
      request.post(
      {
        url: hosting.host,
        form: {
          call: 'api',
          key: hosting.key,
          isForDebug: true,
          usersWanted: false
        },
        headers: {
          'Content-Type': 'application/json'
        },
        followAllRedirects: true
      },
      function (err, httpResponse, body){

        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // error
        if (httpResponse.statusCode !== 200) {
          return res.json({
            status: false,
            msg: req.__("L'hébergement a retourné un code HTTP non valide ("+httpResponse.statusCode+")")
          })
        }

        // decode
        try {
          var debug = JSON.parse(body)
        } catch (e) {
          sails.log.error(e)
          return res.json({
            status: false,
            msg: req.__("L'hébergement n'a pas retourné de ressource au format JSON.")
          })
        }

        // send
        return res.json({
          status: true,
          msg: req.__("L'hébergement a bien transféré les informations de débug !"),
          data: {
            debug: debug
          }
        })

      })

    })
  },

  /*getSQLDump: function (req, res) {
    // Get id
		if (req.param('id') === undefined) {
			return res.notFound('Id is missing')
		}
		var id = req.param('id')

    var self = this

    // find
    Hosting.findOne({id: id}).exec(function (err, hosting) {

      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (hosting === undefined)
        return res.notFound()

    }}
  },

  getLogs: function (req, res) {

  }*/

}
