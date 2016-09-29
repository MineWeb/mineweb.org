/**
 * Admin/UserController
 *
 * @description :: Server-side logic for managing user
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')

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

    // find
    User.findOne({id: id}).populate(['licenses', 'hostings', 'purchases', 'paypalPayments', 'dedipassPayments', 'plugins', 'themes']).exec(function (err, user) {

      // error
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // not found
      if (user === undefined)
        return res.notFound()

      // purchases
      Purchase.findAllOfUser(req.session.userId, function (err, purchases) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }
        user.purchases = purchases
        res.view('admin/user/view', {
          title: req.__("Détails d'un utilisateur"),
          userFinded: user
        })
      })

    })
  }

}
