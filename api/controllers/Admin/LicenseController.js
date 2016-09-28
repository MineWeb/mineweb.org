/**
 * Admin/LicensesController
 *
 * @description :: Server-side logic for search license/hosting
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')

module.exports = {

  findPage: function (req, res) {
    res.view('admin/find_license_or_hosting', {
      title: req.__('Chercher un(e) licence/hébergement')
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

    // find
    License.findOne({id: id}).populate(['user', 'purchase']).exec(function (err, license) {

      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (license === undefined)
        return res.notFound()

      var payment = undefined

      // if purchase type is paypal/dedipass, find payment
      if (license.purchase.paymentType === 'PAYPAL' || license.purchase.paymentType === 'DEDIPASS') {
        var model = (license.purchase.paymentType === 'PAYPAL') ? PayPalHistory : DedipassHistory
        model.findOne({purchase: license.purchase.id}).exec(function (err, purchasePayment) {
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

        res.view('admin/license/view', {
          title: req.__("Détails d'une licence"),
          payment: payment,
          license: license
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

    // find
    License.findOne({id: id}).populate(['user']).exec(function (err, license) {

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
          licenseHost: license.host
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

    // find
    License.findOne({id: id}).populate(['user']).exec(function (err, license) {

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
          licenseHost: license.host
        }, req.__('Réactivation de votre licence'), license.user.email)

      })

    })
  }

}
