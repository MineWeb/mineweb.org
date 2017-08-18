/**
 * Admin/StatisticController
 *
 * @description :: Server-side logic for view statistics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')
var moment = require('moment')
var _ = require('underscore')

module.exports = {

  index: function (req, res) {
    var dataMonthsList = {}
      dataMonthsList[moment().subtract('6', 'month').month() + 1] = 0
      dataMonthsList[moment().subtract('5', 'month').month() + 1] = 0
      dataMonthsList[moment().subtract('4', 'month').month() + 1] = 0
      dataMonthsList[moment().subtract('3', 'month').month() + 1] = 0
      dataMonthsList[moment().subtract('2', 'month').month() + 1] = 0
      dataMonthsList[moment().subtract('1', 'month').month() + 1] = 0
      dataMonthsList[moment().month() + 1] = 0
    var dataDaysList = {}
      dataDaysList[moment().subtract('6', 'day').format('D')] = 0
      dataDaysList[moment().subtract('5', 'day').format('D')] = 0
      dataDaysList[moment().subtract('4', 'day').format('D')] = 0
      dataDaysList[moment().subtract('3', 'day').format('D')] = 0
      dataDaysList[moment().subtract('2', 'day').format('D')] = 0
      dataDaysList[moment().subtract('1', 'day').format('D')] = 0
      dataDaysList[moment().format('D')] = 0

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
        User.query("SELECT AVG(b.profit) AS averageMonthlyProfit FROM (SELECT SUM(a.profit) AS profit, a.mnth FROM (SELECT SUM(paymentAmount - taxAmount) AS profit, MONTH(createdAt) as mnth FROM paypalhistory WHERE state = 'COMPLETED' GROUP BY mnth UNION SELECT SUM(payout) AS profit, MONTH(createdAt) as mnth FROM dedipasshistory GROUP BY mnth) AS a GROUP BY a.mnth) AS b", callback)
      },

      // Get total profit
      function (callback) {
        User.query("SELECT SUM(a.profit) AS totalProfit FROM (SELECT SUM(paymentAmount - taxAmount) AS profit FROM paypalhistory WHERE state = 'COMPLETED' UNION SELECT SUM(payout) AS profit FROM dedipasshistory) AS a", callback)
      },

      // Get month profit
      function (callback) {
        User.query('SELECT SUM(a.profit) AS monthProfit FROM (SELECT SUM(paymentAmount - taxAmount) AS profit FROM paypalhistory WHERE MONTH(createdAt) = \'' + ((new Date()).getMonth() +1) + '\' AND state = \'COMPLETED\' UNION SELECT SUM(payout) AS profit FROM dedipasshistory WHERE MONTH(createdAt) = \'' + ((new Date()).getMonth() +1) + '\') AS a', callback)
      },

      // Get licences purchases last 7 months
      function (callback) {
        // vars
        var sales = []

        var months = [
          moment().subtract(6, 'months').format('YYYY-MM'),
          moment().subtract(5, 'months').format('YYYY-MM'),
          moment().subtract(4, 'months').format('YYYY-MM'),
          moment().subtract(3, 'months').format('YYYY-MM'),
          moment().subtract(2, 'months').format('YYYY-MM'),
          moment().subtract(1, 'months').format('YYYY-MM'),
          moment().format('YYYY-MM'),
        ]

        // sql
        async.forEach(months, function (month, next) { // for each months

          License.count({createdAt: {'like': month + '%'}, hosting: null}).exec(function (err, count) {
            if (err)
              sales.push(0)
            else
              sales.push(count)
            next()
          })
        }, function () {
          callback(undefined, sales)
        })
      },

      // Get hostings purchases last 7 months
      function (callback) {
        // vars
        var sales = []

        var months = [
          moment().subtract(6, 'months').format('YYYY-MM'),
          moment().subtract(5, 'months').format('YYYY-MM'),
          moment().subtract(4, 'months').format('YYYY-MM'),
          moment().subtract(3, 'months').format('YYYY-MM'),
          moment().subtract(2, 'months').format('YYYY-MM'),
          moment().subtract(1, 'months').format('YYYY-MM'),
          moment().format('YYYY-MM'),
        ]

        // sql
        async.forEach(months, function (month, next) { // for each months
          Hosting.query("SELECT COUNT(*) AS count FROM purchase WHERE type = 'HOSTING' AND createdAt LIKE '" + month + "%'", function (err, res) {
            if (err)
              sales.push(0)
            else
              sales.push(res.count)
            next()
          })
        }, function () {
          callback(undefined, sales)
        })
      },

      function (callback) {
        User.query('SELECT SUM(sum) AS total, month FROM (\n' +
          '  SELECT SUM(paypal.paymentAmount - paypal.taxAmount) AS sum, MONTH(paypal.paymentDate) AS month, YEAR(paypal.paymentDate) AS year FROM paypalhistory AS paypal \n' +
          '  INNER JOIN purchase AS purchase ON purchase.id = paypal.purchase \n' +
          '  WHERE \n' +
          '  \t(purchase.type = \'LICENSE\' OR purchase.type = \'HOSTING\') \n' +
          '  \tAND paypal.state = \'COMPLETED\'\n' +
          '  GROUP BY MONTH(paypal.paymentDate) + \'.\' + YEAR(paypal.paymentDate)\n' +
          'UNION ALL\n' +
          '  SELECT SUM(dedipass.payout) AS sum, MONTH(dedipass.createdAt) AS month, YEAR(dedipass.createdAt) AS year FROM dedipasshistory AS dedipass \n' +
          '  INNER JOIN purchase AS purchase ON purchase.id = dedipass.purchase \n' +
          '  WHERE (purchase.type = \'LICENSE\' OR purchase.type = \'HOSTING\') \n' +
          '  GROUP BY MONTH(dedipass.createdAt) + \'.\' + YEAR(dedipass.createdAt)\n' +
          ') AS q\n' +
          'WHERE month >= MONTH(DATE_SUB(now(), INTERVAL 6 MONTH)) AND year >= YEAR(DATE_SUB(now(), INTERVAL 6 MONTH))\n' +
          'GROUP BY month\n' +
          'ORDER BY year,month;', function (err, data) {
            if (err) return callback(err)
            // add results to defaults results
            var dataMonths = _.clone(dataMonthsList)
            for (var i = 0; i < data.length; i++) {
              dataMonths[data[i].month] = data[i].total
            }
            // format into simple array
            var dataFormatted = []
            for (var month in dataMonths) {
              if (dataMonths[month])
                dataFormatted.push(Math.round(dataMonths[month]))
              else
                dataFormatted.push(0);
            }
            // return data
            callback(null, dataFormatted)
        })
      },

      function (callback) {
        User.query('SELECT plugin.name, ROUND(SUM(paypalhistory.paymentAmount - paypalhistory.taxAmount)) AS total FROM plugin INNER JOIN purchase ON purchase.itemId = plugin.id AND purchase.type = \'PLUGIN\' INNER JOIN paypalhistory ON paypalhistory.id = purchase.paymentId GROUP BY plugin.id ORDER BY total DESC;', callback)
      },

      function (callback) {
        User.query('SELECT theme.name, ROUND(SUM(paypalhistory.paymentAmount - paypalhistory.taxAmount)) AS total FROM theme INNER JOIN purchase ON purchase.itemId = theme.id AND purchase.type = \'THEME\' INNER JOIN paypalhistory ON paypalhistory.id = purchase.paymentId GROUP BY theme.id ORDER BY total DESC;', callback)
      }

    ], function (err, results) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      moment.locale(res.locals.user.lang)

      res.view('admin/statistic/index', {
        title: req.__('Statistiques'),
        lastMonths: [
          Utils.ucfirst(moment().subtract('6', 'month').format('MMMM')),
          Utils.ucfirst(moment().subtract('5', 'month').format('MMMM')),
          Utils.ucfirst(moment().subtract('4', 'month').format('MMMM')),
          Utils.ucfirst(moment().subtract('3', 'month').format('MMMM')),
          Utils.ucfirst(moment().subtract('2', 'month').format('MMMM')),
          Utils.ucfirst(moment().subtract('1', 'month').format('MMMM')),
          Utils.ucfirst(moment().format('MMMM'))
        ],
        lastDays: [
          Utils.ucfirst(moment().subtract('6', 'day').format('dddd')),
          Utils.ucfirst(moment().subtract('5', 'day').format('dddd')),
          Utils.ucfirst(moment().subtract('4', 'day').format('dddd')),
          Utils.ucfirst(moment().subtract('3', 'day').format('dddd')),
          Utils.ucfirst(moment().subtract('2', 'day').format('dddd')),
          Utils.ucfirst(moment().subtract('1', 'day').format('dddd')),
          Utils.ucfirst(moment().format('dddd'))
        ],
        stats: {
          usersCount: Utils.numberWithSpaces(results[0]),
          usersMonthlyAverageRegister: Math.round(results[1][0].avg),
          usersRegisterCountThisMonth: results[2],
          averageMonthlyProfit: Utils.numberWithSpaces(results[3][0].averageMonthlyProfit),
          totalProfit: Utils.numberWithSpaces(results[4][0].totalProfit),
          monthProfit: Utils.numberWithSpaces(results[5][0].monthProfit),
          purchasesThisMonth: {
            licences: results[6],
            hostings: results[7]
          },
          totalIncomeByMonths: results[8],
          pluginsIncomes: results[9],
          themesIncomes: results[10]
        }
      })
    })
  }

}
