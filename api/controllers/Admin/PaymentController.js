/**
 * Admin/PaymentController
 *
 * @description :: Server-side logic for list payment (dedipass/paypal)
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')
var moment = require('moment')

module.exports = {

  view: function (req, res) {
    async.parallel([
      // find paypals payments
      function (callback) {
        PayPalHistory.find().populate(['purchase', 'user']).sort('id DESC').exec(callback)
      },
      // find dedipass payments
      function (callback) {
        DedipassHistory.find().populate(['purchase', 'user']).sort('id DESC').exec(callback)
      },
      // find plugins (display it with purchase.itemId)
      function (callback) {
        Plugin.find().exec(function (err, data) {
          if (err) return callback(err)
          // order by id
          var dataOrdered = {}
          for (var i = 0; i < data.length; i++) {
            dataOrdered[data[i].id] = data[i]
          }
          // return
          callback(null, dataOrdered)
        })
      },
      // find themes (display it with purchase.itemId)
      function (callback) {
        Theme.find().exec(function (err, data) {
          if (err) return callback(err)
          // order by id
          var dataOrdered = {}
          for (var i = 0; i < data.length; i++) {
            dataOrdered[data[i].id] = data[i]
          }
          // return
          callback(null, dataOrdered)
        })
      }
    ], function (err, results) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      moment.locale(req.acceptedLanguages[0])

      // render page
      res.view('admin/payment/view', {
        title: req.__('Liste des paiements'),
        paypalPayments: results[0] || [],
        dedipassPayments: results[1] || [],
        lists: {
          PLUGIN: results[2] || {},
          THEME: results[3] || {}
        },
        moment: moment
      })

    })
  }

}
