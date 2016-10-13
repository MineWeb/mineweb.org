/**
 * Admin/UserController
 *
 * @description :: Server-side logic for managing user
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')
var moment = require('moment')

module.exports = {

  findPage: function (req, res) {
    res.view('admin/user/find', {
      title: req.__('Chercher un utilisateur')
    })
  },

  find: function (req, res) {
    // handle conditions
    var conditions = {}

    if (req.body.id !== undefined && req.body.id.length > 0)
      conditions.id = req.body.id
    if (req.body.username !== undefined && req.body.username.length > 0)
      conditions.username = req.body.username
    if (req.body.email !== undefined && req.body.email.length > 0)
      conditions.email = req.body.email
    if (req.body.ip !== undefined && req.body.ip.length > 0)
      conditions.ip = req.body.ip

    if (Object.keys(conditions).length === 0) {
      return res.json({
        status: false,
        msg: req.__('Vous devez au moins remplir un critère.'),
        inputs: {}
      })
    }

    // search
    User.findOne(conditions).exec(function (err, user) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      if (user === undefined) {
        return res.json({
          status: false,
          msg: req.__('Aucune utilisateur trouvé avec les informations fournies.'),
          inputs: {}
        })
      }

      return res.json({
        status: true,
        msg: req.__('Un utilisateur a été trouvé ! Redirection en cours...'),
        inputs: {},
        data: {
          user: {
            id: user.id
          }
        }
      })

    })
  },

  view: function (req, res) {
    // Get id
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    async.parallel([

      // find user
      function (callback) {
        User.findOne({ id: id }).populate(['paypalPayments', 'dedipassPayments', , 'plugins', 'themes']).exec(callback)
      },

      // find purchases
      function (callback) {
        Purchase.findAllOfUser(id, function (err, purchases) {
          callback(err, purchases)
        })
      },

      // find connectionLogs
      function (callback) {
        UserLog.find({user: id, action: 'LOGIN'}).limit(5).sort('createdAt DESC').exec(function (err, logs) {
          callback(err, logs)
        })
      },

      // find tickets
      function (callback) {
        Ticket.find({user: id}).exec(function (err, tickets) {
          callback(err, tickets)
        })
      },

      // find licenses
      function (callback) {
        License.find({user: id}).populate(['hosting']).exec(function (err, licenses) {
          if (err)
            return callback(err)

          var results = {licenses: [], hostings: []}

          for (var i = 0; i < licenses.length; i++) {
            if (licenses[i].hosting) {
              results.hostings.push(licenses[i])
            }
            else {
              results.licenses.push(licenses[i])
            }
          }

          callback(null, results)

        })
      }

    ], function (err, results) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      if (results[0] === undefined)
        return res.notFound()
      else
        var user = results[0]

      user.licenses = results[4].licenses
      user.hostings = results[4].hostings

      user.purchases = results[1]
      res.view('admin/user/view', {
        title: req.__("Détails d'un utilisateur"),
        userFinded: user,
        userTickets: (results[3] !== undefined) ? results[3] : [],
        connectionLogs: (results[2] !== undefined) ? results[2] : [],
        moment: moment
      })

    })
  }

}
