/**
 * Admin/DashboardController
 *
 * @description :: Server-side logic for managing admin dashboard
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')

module.exports = {

  admin: function (req, res) {
    var userRole = res.locals.user.role
    var firstPermission = sails.config.permissionsAccess[userRole][0]

    if (firstPermission === '*')
      return res.redirect('/admin/dashboard')

    var permission = sails.config.permissionsList[firstPermission]
    var routes = sails.config.routes

    // search perm into routes
    for (var route in routes) {
      if (typeof routes[route] !== 'string' || route === '/admin')
        continue
      if (permission.action)
        if (routes[route].toLowerCase() === permission.controller.toLowerCase() + 'controller.' + permission.action.toLowerCase())
          return res.redirect(route)
      else
        if (routes[route].toLowerCase().indexOf(permission.controller.toLowerCase() + 'controller.') !== -1)
          return res.redirect(route)
    }
    res.notFound()
  },

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
        License.count({hosting: null}).exec(function (err, count) {
          callback(err, count)
        })
      },

      // Count total money
      function (callback) {
        async.parallel([
          // Find with PayPal
          function (next) {
            PayPalHistory.query("SELECT SUM(paypal.paymentAmount - paypal.taxAmount) AS sum FROM paypalhistory AS paypal INNER JOIN purchase AS purchase ON purchase.id = paypal.purchase WHERE (purchase.type = 'LICENSE' OR purchase.type = 'HOSTING') AND paypal.state = 'COMPLETED'", function (err, profit) {
              if (err)
                return next(err)
              next(null, profit[0].sum)
            })
          },
          // Find with Dedipass
          function (next) {
            DedipassHistory.query("SELECT SUM(dedipass.payout) AS sum FROM dedipasshistory AS dedipass INNER JOIN purchase AS purchase ON purchase.id = dedipass.purchase WHERE (purchase.type = 'LICENSE' OR purchase.type = 'HOSTING')", function (err, profit) {
              if (err)
                return next(err)
              next(null, profit[0].sum)
            })
          }
        ], function (err, results) {
          if (err)
            return callback(err)
          callback(null, (results[0] + results[1]))
        })
      },

      // Find profit this month
      function (callback) {
        var date = new Date()
        var month = date.getMonth() + 1
        if (month.toString().length === 1)
          month = '0' + month
        date = date.getFullYear() + '-' + month + '-'

        async.parallel([
          // Find with PayPal
          function (next) {
            PayPalHistory.query("SELECT SUM(paypal.paymentAmount - paypal.taxAmount) AS sum FROM paypalhistory AS paypal INNER JOIN purchase AS purchase ON purchase.id = paypal.purchase WHERE (purchase.type = 'LICENSE' OR purchase.type = 'HOSTING') AND MONTH(paypal.paymentDate) = MONTH(NOW()) AND paypal.state = 'COMPLETED'", function (err, profit) {
              if (err)
                return next(err)
              next(null, profit[0].sum)
            })
          },
          // Find with Dedipass
          function (next) {
            DedipassHistory.query("SELECT SUM(dedipass.payout) AS sum FROM dedipasshistory AS dedipass INNER JOIN purchase AS purchase ON purchase.id = dedipass.purchase WHERE (purchase.type = 'LICENSE' OR purchase.type = 'HOSTING') AND MONTH(dedipass.createdAt) = MONTH(NOW())", function (err, profit) {
              if (err)
                return next(err)
              next(null, profit[0].sum)
            })
          }
        ], function (err, results) {
          if (err)
            return callback(err)
          callback(null, (results[0] + results[1]))
        })
      },

      // Licenses sales
      function (callback) {
        // vars
        var sales = []

        var d = new Date()
        var year = d.getFullYear()

        var months = [
          (d.getMonth() - 4), // 6 months ago
          (d.getMonth() - 3), // 5 months ago
          (d.getMonth() - 2), // ...
          (d.getMonth() - 1),
          (d.getMonth()),
          (d.getMonth() + 1) // actual month
        ]

        // sql
        async.forEach(months, function (month, next) { // for each months

          if (month.toString().length === 1)
            month = '0' + month
          var date = year + '-' + month + '-' // setup date LIKE

          License.count({createdAt: {'like': date + '%'}, hosting: null}).exec(function (err, count) {
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

      // Hostings sales
      function (callback) {
        // vars
        var sales = []

        var d = new Date()
        var year = d.getFullYear()

        var months = [
          (d.getMonth() - 4), // 6 months ago
          (d.getMonth() - 3), // 5 months ago
          (d.getMonth() - 2), // ...
          (d.getMonth() - 1),
          (d.getMonth()),
          (d.getMonth() + 1) // actual month
        ]

        // sql
        async.forEach(months, function (month, next) { // for each months

          if (month.toString().length === 1)
            month = '0' + month
          date = year + '-' + month + '-' // setup date LIKE

          Hosting.count({createdAt: {'like': date + '%'}}).exec(function (err, count) {
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

      // Tickets
      function (callback) {
        async.parallel([

          // openedTickets
          function (next) {
            Ticket.count({state: {'!': 'CLOSED'}}).exec(function (err, count) {
              next(err, count)
            })
          },

          // nonSupportedTickets
          function (next) {
            Ticket.count({state: {'!': 'CLOSED'}, supported: null}).exec(function (err, count) {
              next(err, count)
            })
          },

          // tickets
          function (next) {
            Ticket.find({state: {'!': 'CLOSED'}}).populate(['supported']).sort('id DESC').limit(5).exec(function (err, tickets) {
              next(err, tickets)
            })
          }

        ], function (err, results) {
          callback(err, results)
        })
      },

      // paymentsList
      function (callback) {
        async.parallel([
          // paypal
          function (next) {
            PayPalHistory.find().populate('user').sort('id desc').limit(10).exec(function (err, payments) {
              if (err)
                return next(err)

              var data = []
              for (var i = 0; i < payments.length; i++) {
                data.push({
                  type: 'PayPal',
                  amount: (payments[i].paymentAmount - payments[i].taxAmount),
                  date: payments[i].paymentDate,
                  user: payments[i].user.username
                })
              }

              next(undefined, data)
            })
          },
          // dedipass
          function (next) {
            DedipassHistory.find().populate('user').sort('id desc').limit(10).exec(function (err, payments) {
              if (err)
                return next(err)

              var data = []
              for (var i = 0; i < payments.length; i++) {
                data.push({
                  type: 'Dédipass',
                  amount: payments[i].payout,
                  date: payments[i].createdAt,
                  user: payments[i].user.username
                })
              }

              next(undefined, data)
            })
          }
        ], function (err, results) {
          callback(err, results)
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
        profitThisMonth: Math.round(results[4]),
        sales: {
          'licenses': results[5],
          'hostings': results[6]
        },
        openedTickets: results[7][0],
        nonSupportedTickets: results[7][1],
        ticketsList: results[7][2],
        paymentsList: results[8][0].concat(results[8][1]).sort(function (payment1, payment2) { // group dedipass + paypal payments -> sort by date
          if (payment1.date > payment2.date) return -1;
          if (payment1.date < payment2.date) return 1;
          return 0
        }).slice(0, 10), // keep only 10 first
        title: req.__('Dashboard')
      })
    })
  },

  settings: function (req, res) {
    // get user role name by default
    if (res.locals.user.role === 'DEVELOPER')
      var defaultRoleName = req.__('Développeur')
    else if (res.locals.user.role === 'MOD')
      var defaultRoleName = req.__('Staff')
    else if (res.locals.user.role === 'ADMIN' || res.locals.user.role === 'FOUNDER')
      var defaultRoleName = req.__('Administrateur')

    res.view('admin/settings', {
      defaultRoleName: defaultRoleName,
      title: req.__('Paramètres')
    })
  },

  updateSettings: function (req, res) {
    // Handle form values
    RequestManagerService.setRequest(req).setResponse(res).valid({
      "Vous devez choisir un email Pushbullet valide !": [
				{
					field: 'pushbulletEmail',
					regex: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
					error: "Cet email n'a pas un format valide."
				}
			],
    }, function () {
      // save
      User.update({id: req.session.userId}, {pushbulletEmail: req.body.pushbulletEmail, customRoleName: req.body.customRoleName}).exec(function (err, userUpdated) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // send success response
        res.json({
          status: true,
          msg: req.__('Vous avez bien modifié vos paramètres !'),
          inputs: {}
        })
      })
    })
  }

}
