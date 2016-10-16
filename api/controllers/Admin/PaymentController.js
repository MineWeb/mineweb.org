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
      // find last paypal payment date
      function (callback) {
        PayPalHistory.find({select: ['createdAt']}).sort('id DESC').limit(1).exec(callback)
      },
      // find last dedipass payment date
      function (callback) {
        DedipassHistory.find({select: ['createdAt']}).sort('id DESC').limit(1).exec(callback)
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
        moment: moment,
        lastPayPalPayment: results[0],
        lastDedipassPayment: results[1]
      })
    })
  },

  getPayPalPayements: function (req, res) {
    async.parallel([
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
      var lists = {
        PLUGIN: results[0] || {},
        THEME: results[1] || {}
      }

      req.query.populate = ['purchase', 'user']
      req.query.order = [{ column: 4, dir: 'desc'}]

      DataTablesService.datatable(PayPalHistory, req.query, function (err, histories) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // edit data
        var formattedData = []
        async.each(histories.data, function (history, callback) {
          if (!history.purchase) {
            delete history.purchase
            history.purchase = {}
            history.purchase.id = 'N/A'
            history.purchase.type = 'N/A'
            history.purchase.itemId = 'N/A'
          }
          else if (history.purchase.type === 'LICENSE' || history.purchase.type === 'HOSTING') {
            history.purchase.itemId = '<a href="/admin/license/view/' + history.purchase.itemId + '"> ' + req.__('Voir') + '</a>'
          }
          else if (history.purchase.type === 'RENEW_LICENSE_HOSTED') {
            history.purchase.itemId = '<a href="/admin/hosting/view/' + history.purchase.itemId + '"> ' + req.__('Voir') + '</a>'
          }
          else if (history.purchase.type === 'PLUGIN' || history.purchase.type === 'THEME') {
            history.purchase.itemId = '<em>' + lists[history.purchase.type][history.purchase.itemId].name + '</em>'
          }

          history.user.username = '<a href="/admin/user/view/' + history.user.id + '"> ' + history.user.id + '#' + history.user.username + '</a>'
          history.paymentId = '<a href="https://www.paypal.com/fr/cgi-bin/webscr?cmd=_view-a-trans&id=' + history.paymentId + '"> ' + history.paymentId + '</a>'
          history.profit = '<span class="text-success">' + (history.paymentAmount - history.taxAmount) + '</span>'
          history.paymentAmount = '<span class="text-info">' + history.paymentAmount + '</span>'
          history.taxAmount = '<span class="text-danger">' + history.taxAmount + '</span>'
          history.paymentDate = '<i class="fa fa-calendar"></i> ' + req.__('Le %s à %s', moment(history.paymentDate).format('L'), moment(history.paymentDate).format('LT'))

          switch (history.state) {
            case 'COMPLETED':
              history.state = '<span class="label label-primary"> ' + req.__('Complété') + '</span>'
              break
            case 'PENDING':
              history.state = '<span class="label label-warning"> ' + req.__('En attente') + '</span>'
              break
            case 'REVERSED':
              history.state = '<span class="label label-warning"> ' + req.__('Suspendu') + '</span>'
              break
            case 'REFUNDED':
              history.state = '<span class="label label-danger"> ' + req.__('Remboursé') + '</span>'

              break
            default:
              history.state = '<span class="label label-danger"> ' + req.__('Échoué') + '</span>'
          }

          if (history.caseDate)
            history.caseDate = '<i class="fa fa-calendar"></i> ' + req.__('Le %s à %s', moment(history.caseDate).format('L'), moment(history.caseDate).format('LT'))
          else
            history.caseDate = 'N/A'
          if (history.refundDate)
            history.refundDate = '<i class="fa fa-calendar"></i> ' + req.__('Le %s à %s', moment(history.refundDate).format('L'), moment(history.refundDate).format('LT'))
          else
            history.refundDate = 'N/A'
          history.updatedAt = '<i class="fa fa-calendar"></i> ' + req.__('Le %s à %s', moment(history.updatedAt).format('L'), moment(history.updatedAt).format('LT'))

          formattedData.push(history)

          callback()
        }, function () {
          histories.data = formattedData
          return res.send(histories)
        })
      })
    })
  },

  getDedipassPayements: function (req, res) {
    async.parallel([
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
      var lists = {
        PLUGIN: results[0] || {},
        THEME: results[1] || {}
      }

      req.query.populate = ['purchase', 'user']
      req.query.order = [{ column: 4, dir: 'desc'}]

      DataTablesService.datatable(DedipassHistory, req.query, function (err, histories) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // edit data
        var formattedData = []
        async.each(histories.data, function (history, callback) {
          if (!history.purchase) {
            delete history.purchase
            history.purchase = {}
            history.purchase.id = 'N/A'
            history.purchase.type = 'N/A'
            history.purchase.itemId = 'N/A'
          }
          else if (history.purchase.type === 'LICENSE' || history.purchase.type === 'HOSTING') {
            history.purchase.itemId = '<a href="/admin/license/view/' + history.purchase.itemId + '"> ' + req.__('Voir') + '</a>'
          }
          else if (history.purchase.type === 'RENEW_LICENSE_HOSTED') {
            history.purchase.itemId = '<a href="/admin/hosting/view/' + history.purchase.itemId + '"> ' + req.__('Voir') + '</a>'
          }
          else if (history.purchase.type === 'PLUGIN' || history.purchase.type === 'THEME') {
            history.purchase.itemId = '<em>' + lists[history.purchase.type][history.purchase.itemId].name + '</em>'
          }

          history.user.username = '<a href="/admin/user/view/' + history.user.id + '"> ' + history.user.id + '#' + history.user.username + '</a>'
          history.createdAt = '<i class="fa fa-calendar"></i> ' + req.__('Le %s à %s', moment(history.createdAt).format('L'), moment(history.createdAt).format('LT'))
          history.updatedAt = '<i class="fa fa-calendar"></i> ' + req.__('Le %s à %s', moment(history.updatedAt).format('L'), moment(history.updatedAt).format('LT'))

          formattedData.push(history)

          callback()
        }, function () {
          histories.data = formattedData
          return res.send(histories)
        })
      })
    })
  }

}
