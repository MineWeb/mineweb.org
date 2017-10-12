/**
 * Admin/LicensesController
 *
 * @description :: Server-side logic for search license/hosting
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')
var request = require('request')

module.exports = {

  switchToLicenseId: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    Hosting.findOne({id: id}).populate(['license']).exec(function (err, hosting) {
      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (hosting === undefined)
        return res.notFound()

      res.redirect('/admin/license/view/' + hosting.license.id)
    })
  },

  getHost: function (license) {
    if (!license.hosting)
      return license.host

    if (license.hosting.hostType === 'SUBDOMAIN')
      return 'http://' + license.host +  '.craftwb.fr'
    else
      return 'http://' + license.host
  },

  findPage: function (req, res) {
    res.view('admin/license/find', {
      title: req.__('Chercher une licence')
    })
  },

  find: function (req, res) {
    // handle 'user' field
    var user
    if (req.body.user == parseInt(req.body.user)) { // is id
      var user = req.body.user
      next()
    }
    else if (req.body.user !== undefined & req.body.user.length > 0) { // find user
      User.findOne({or:
        [
          {username: req.body.user},
          {email: req.body.user}
        ]}).exec(function (err, userFinded) {
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
      if (req.body.type !== undefined && req.body.type.length > 0)
        conditions.hosting = (req.body.type == 'LICENSE') ? null : {'!': null}
      if (req.body.key !== undefined && req.body.key.length > 0)
        conditions.key = req.body.key
      if (req.body.host !== undefined && req.body.host.length > 0)
        conditions.host = {'like': '%' + req.body.host + '%'}
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
      License.findOne(conditions).exec(function (err, license) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        if (license === undefined) {
          return res.json({
            status: false,
            msg: req.__('Aucune licence trouvée avec les informations fournies.'),
            inputs: {}
          })
        }

        return res.json({
          status: true,
          msg: req.__('Une licence a été trouvée ! Redirection en cours...'),
          inputs: {},
          data: {
            license: {
              id: license.id
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
    License.findOne({id: id}).populate(['user', 'purchase', 'hosting']).exec(function (err, license) {
      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (license === undefined)
        return res.notFound()

      async.parallel([

        // find payment
        function (callback) {
          // if purchase type is paypal/dedipass, find payment
          if (license.purchase && (license.purchase.paymentType === 'PAYPAL' || license.purchase.paymentType === 'DEDIPASS')) {
            var model = (license.purchase.paymentType === 'PAYPAL') ? PayPalHistory : DedipassHistory
            model.findOne({purchase: license.purchase.id}).exec(callback)
          }
          else {
            callback()
          }
        },

        // find apiLogs
        function (callback) {
          ApiLog.find({license: license.id}).sort('id DESC').limit(30).exec(callback)
        },

        // find lastCheckDate
        function (callback) {
          ApiLog.findOne({license: license.id, action: ['/key_verif', '/authentication'], status: true}).sort('id DESC').exec(callback)
        }

      ], function (err, results) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        license.host = self.getHost(license)
        res.view('admin/license/view', {
          title: req.__("Détails d'une licence"),
          payment: results[0],
          license: license,
          lastCheckDate: (results[2]) ? results[2].createdAt : (new Date()),
          plugins: (results[2]) ? results[2].plugins : [],
          themes: (results[2]) ? results[2].themes : [],
          current_theme: (results[2]) ? results[2].current_theme : "Bootstrap",
          users_count: (results[2]) ? results[2].users_count : 0,
          apiLogs: results[1] || []
        })
      })
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
    License.findOne({id: id}).populate(['user', 'hosting']).exec(function (err, license) {
      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (license === undefined)
        return res.notFound()

      // update db
      License.update({id: license.id}, {suspended: reason, state: false}).exec(function (err, licenseUpdated) {
        // error
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // send notification toastr
        NotificationService.success(req, req.__('Vous avez bien suspendu la licence !'))

        // redirect
        res.redirect('/admin/license/view/' + license.id)

        // send notification to user
        MailService.send('licence_suspended', {
          username: license.user.username,
          reason: reason,
          licenseId: license.id,
          licenseHost: self.getHost(license)
        }, req.__('Suspension de votre licence'), license.user.email)
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
    License.findOne({id: id}).populate(['user', 'hosting']).exec(function (err, license) {
      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (license === undefined)
        return res.notFound()

      // update db
      License.update({id: license.id}, {suspended: null, state: true}).exec(function (err, licenseUpdated) {
        // error
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // send notification toastr
        NotificationService.success(req, req.__('Vous avez bien réactiver la licence !'))

        // redirect
        res.redirect('/admin/license/view/' + license.id)

        // send notification to user
        MailService.send('licence_unsuspended', {
          username: license.user.username,
          reason: license.suspended,
          licenseId: license.id,
          licenseHost: self.getHost(license)
        }, req.__('Réactivation de votre licence'), license.user.email)
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
    License.findOne({id: id}).populate(['hosting']).exec(function (err, license) {
      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (license === undefined)
        return res.notFound()

      if (!license.host) {
        return res.json({
          status: false,
          msg: req.__("La licence n'est pas installée")
        })
      }

      // request
      request.post(
      {
        url: self.getHost(license),
        form: {
          call: 'api',
          key: license.key,
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
            msg: req.__("La licence a retournée un code HTTP non valide ("+httpResponse.statusCode+")")
          })
        }

        // decode
        try {
          var debug = JSON.parse(body)
        } catch (e) {
          sails.log.error(e)
          return res.json({
            status: false,
            msg: req.__("La licence n'a pas retournée de ressource au format JSON.")
          })
        }

        // send
        return res.json({
          status: true,
          msg: req.__("La licence a bien transféré les informations de débug !"),
          data: {
            debug: debug
          }
        })

      })

    })
  }

}
