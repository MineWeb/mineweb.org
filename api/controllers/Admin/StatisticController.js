/**
 * Admin/StatisticController
 *
 * @description :: Server-side logic for view statistics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')

module.exports = {

  index: function (req, res) {

    async.parallel([

      // Get users count
      function (callback) {
        User.count().exec(callback)
      },

      // Get user average per month
      function (callback) {
        User.query('SELECT AVG(a.count) AS avg FROM (SELECT count(*) AS count, MONTH(createdAt) as mnth FROM user GROUP BY mnth) AS a', callback)
      },

      // Get users count this month
      function (callback) {
        var d = new Date()
        User.count({'createdAt': {'like': d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-%'}}).exec(callback)
      },

      // Get profit average per month
      function (callback) {
        User.query('SELECT AVG(b.profit) AS averageMonthlyProfit FROM (SELECT SUM(a.profit) AS profit, a.mnth FROM (SELECT SUM(paymentAmount - taxAmount) AS profit, MONTH(createdAt) as mnth FROM paypalhistory GROUP BY mnth UNION SELECT SUM(payout) AS profit, MONTH(createdAt) as mnth FROM dedipasshistory GROUP BY mnth) AS a GROUP BY a.mnth) AS b', callback)
      },

      // Get total profit
      function (callback) {
        User.query('SELECT SUM(a.profit) AS totalProfit FROM (SELECT SUM(paymentAmount - taxAmount) AS profit FROM paypalhistory UNION SELECT SUM(payout) AS profit FROM dedipasshistory) AS a', callback)
      },

      // Get month profit
      function (callback) {
        User.query('SELECT SUM(a.profit) AS monthProfit FROM (SELECT SUM(paymentAmount - taxAmount) AS profit FROM paypalhistory WHERE MONTH(createdAt) = \'' + ((new Date()).getMonth() +1) + '\' UNION SELECT SUM(payout) AS profit FROM dedipasshistory WHERE MONTH(createdAt) = \'' + ((new Date()).getMonth() +1) + '\') AS a', callback)
      },

      // Get licences purchases this week
      function (callback) {
        License.query('SELECT COUNT(*) AS count, DAY(createdAt) AS day FROM license WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 WEEK) GROUP BY day', callback)
      },

      // Get hostings purchases this week
      function (callback) {
        Hosting.query('SELECT COUNT(*) AS count, DAY(createdAt) AS day FROM hosting WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 WEEK) GROUP BY day', callback)
      },

      // Get licences purchases last months
      function (callback) {
        License.query('SELECT COUNT(*) AS count, MONTH(createdAt) AS month FROM license GROUP BY month', callback)
      },

      // Get hostings purchases last months
      function (callback) {
        Hosting.query('SELECT COUNT(*) AS count, MONTH(createdAt) AS month FROM hosting GROUP BY month', callback)
      },

      // Get percentage hosting/licences buy this month

      // Get plugins purchases last months

      // Get themes purchases last months

    ], function (err, results) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      res.view('admin/statistic/index', {
        title: req.__("Statistiques"),
        stats: {
          usersCount: Utils.numberWithSpaces(results[0]),
          usersMonthlyAverageRegister: results[1][0].avg,
          usersRegisterCountThisMonth: results[2],
          averageMonthlyProfit: Utils.numberWithSpaces(results[3][0].averageMonthlyProfit),
          totalProfit: Utils.numberWithSpaces(results[4][0].totalProfit),
          monthProfit: Utils.numberWithSpaces(results[5][0].monthProfit),
          licencesHostingsPurchasesThisMonth: {
            licences: results[8],
            hostings: results[9]
          }
        }
      })

    })

  }

}
