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

      // Get licences purchases last 7 months
      function (callback) {
        License.query('SELECT COUNT(*) AS count, MONTH(createdAt) AS month FROM license WHERE hosting IS NULL GROUP BY month LIMIT 7', function (err, data) {
          if (err) return callback(err)
          // add results to defaults results
          var dataMonths = _.clone(dataMonthsList)
          for (var i = 0; i < data.length; i++) {
            dataMonths[data[i].month] = data[i].count
          }
          // format into simple array
          var dataFormatted = []
          for (var month in dataMonths) {
            dataFormatted.push(dataMonths[month])
          }
          // return data
          callback(null, dataFormatted)
        })
      },

      // Get hostings purchases last 7 months
      function (callback) {
        Hosting.query('SELECT COUNT(*) AS count, MONTH(createdAt) AS month FROM hosting GROUP BY month LIMIT 7', function (err, data) {
          if (err) return callback(err)
          // add results to defaults results
          var dataMonths = _.clone(dataMonthsList)
          for (var i = 0; i < data.length; i++) {
            dataMonths[data[i].month] = data[i].count
          }
          // format into simple array
          var dataFormatted = []
          for (var month in dataMonths) {
            dataFormatted.push(dataMonths[month])
          }
          // return data
          callback(null, dataFormatted)
        })
      },

      // Get plugins purchases last months
      function (callback) {
        Plugin.query('SELECT COUNT(*) AS count, MONTH(createdAt) AS month FROM plugin GROUP BY month LIMIT 7', function (err, data) {
          if (err) return callback(err)
          // add results to defaults results
          var dataMonths = _.clone(dataMonthsList)
          for (var i = 0; i < data.length; i++) {
            dataMonths[data[i].month] = data[i].count
          }
          // format into simple array
          var dataFormatted = []
          for (var month in dataMonths) {
            dataFormatted.push(dataMonths[month])
          }
          // return data
          callback(null, dataFormatted)
        })
      },

      // Get themes purchases last months
      function (callback) {
        Theme.query('SELECT COUNT(*) AS count, MONTH(createdAt) AS month FROM theme GROUP BY month LIMIT 7', function (err, data) {
          if (err) return callback(err)
          // add results to defaults results
          var dataMonths = _.clone(dataMonthsList)
          for (var i = 0; i < data.length; i++) {
            dataMonths[data[i].month] = data[i].count
          }
          // format into simple array
          var dataFormatted = []
          for (var month in dataMonths) {
            dataFormatted.push(dataMonths[month])
          }
          // return data
          callback(null, dataFormatted)
        })
      },

      // Get paypal purchases last months
      function (callback) {
        PayPalHistory.query('SELECT COUNT(*) AS count, MONTH(createdAt) AS month FROM paypalhistory GROUP BY month LIMIT 7', function (err, data) {
          if (err) return callback(err)
          // add results to defaults results
          var dataMonths = _.clone(dataMonthsList)
          for (var i = 0; i < data.length; i++) {
            dataMonths[data[i].month] = data[i].count
          }
          // format into simple array
          var dataFormatted = []
          for (var month in dataMonths) {
            dataFormatted.push(dataMonths[month])
          }
          // return data
          callback(null, dataFormatted)
        })
      },

      // Get dedipass purchases last months
      function (callback) {
        DedipassHistory.query('SELECT COUNT(*) AS count, MONTH(createdAt) AS month FROM dedipasshistory GROUP BY month LIMIT 7', function (err, data) {
          if (err) return callback(err)
          // add results to defaults results
          var dataMonths = _.clone(dataMonthsList)
          for (var i = 0; i < data.length; i++) {
            dataMonths[data[i].month] = data[i].count
          }
          // format into simple array
          var dataFormatted = []
          for (var month in dataMonths) {
            dataFormatted.push(dataMonths[month])
          }
          // return data
          callback(null, dataFormatted)
        })
      },

      // Get paypal purchases last week
      function (callback) {
        PayPalHistory.query('SELECT COUNT(*) AS count, DAY(createdAt) AS day FROM paypalhistory WHERE createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY day LIMIT 7', function (err, data) {
          if (err) return callback(err)
          // add results to defaults results
          var dataDays = _.clone(dataDaysList)
          for (var i = 0; i < data.length; i++) {
            dataDays[data[i].day] = data[i].count
          }
          // format into simple array
          var dataFormatted = []
          for (var day in dataDays) {
            dataFormatted.push(dataDays[day])
          }
          // return data
          callback(null, dataFormatted)
        })
      },

      // Get dedipass purchases last week
      function (callback) {
        DedipassHistory.query('SELECT COUNT(*) AS count, DAY(createdAt) AS day FROM dedipasshistory WHERE createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY day LIMIT 7', function (err, data) {
          if (err) return callback(err)
          // add results to defaults results
          var dataDays = _.clone(dataDaysList)
          for (var i = 0; i < data.length; i++) {
            dataDays[data[i].day] = data[i].count
          }
          // format into simple array
          var dataFormatted = []
          for (var day in dataDays) {
            dataFormatted.push(dataDays[day])
          }
          // return data
          callback(null, dataFormatted)
        })
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
          usersMonthlyAverageRegister: results[1][0].avg,
          usersRegisterCountThisMonth: results[2],
          averageMonthlyProfit: Utils.numberWithSpaces(results[3][0].averageMonthlyProfit),
          totalProfit: Utils.numberWithSpaces(results[4][0].totalProfit),
          monthProfit: Utils.numberWithSpaces(results[5][0].monthProfit),
          purchasesThisMonth: {
            licences: results[6],
            hostings: results[7],
            plugins: results[8],
            themes: results[9],
            paypal: results[10],
            dedipass: results[11]
          },
          purchasesLastDays: {
            paypal: results[12],
            dedipass: results[13]
          }
        }
      })
    })
  }

}
