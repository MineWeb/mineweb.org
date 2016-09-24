/**
 * Admin/DashboardController
 *
 * @description :: Server-side logic for managing admin dashboard
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')

module.exports = {

  index: function (req, res) {

    async.parallel([

      // Count users
      function (callback) {
        User.count().exec(function (err, count) {
          callback(err, count)
        })
      },

      // Count hostings
      function (callback) {
        Hosting.count().exec(function (err, count) {
          callback(err, count)
        })
      },

      // Count licenses
      function (callback) {
        License.count().exec(function (err, count) {
          callback(err, count)
        })
      },

      // Count total money
      function (callback) {

        async.parallel([
          // Find with PayPal
          function (next) {
            PayPalHistory.query('SELECT SUM(paymentAmount - taxAmount) AS amount FROM paypalhistory WHERE 1', function (err, profit) {
              if (err)
                return next(err)
              next(null, profit[0].amount)
            })
          },
          // Find with Dedipass
          function (next) {
            DedipassHistory.find().limit(1).sum('payout').exec(function (err, profit) {
              if (err)
                return next(err)
              next(null, profit[0].payout)
            })
          }
        ], function (err, results) {
          if (err)
            return callback(err)
          callback(null, results[0]+results[1])
        })

      }

    ], function (err, results) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      res.view('admin/dashboard', {
        usersCount: results[0],
        hostingsCount: results[1],
        licensesCount: results[2],
        profit: Math.round(results[3]),
        title: req.__('Dashboard')
      })

    })

  }

}
