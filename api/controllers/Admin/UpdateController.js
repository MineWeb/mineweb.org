/**
 * Admin/UpdateController
 *
 * @description :: Server-side logic for managing update
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var moment = require('moment')

module.exports = {

  index: function (req, res) {
    Version.find().sort('id DESC').exec(function(err, versions) {

      if (err) {
        sails.log.error(err)
        return response.serverError();
      }

      res.view('admin/update/index', {
        title: req.__("Gérer les mises à jours"),
        versions: versions,
        moment: moment
      })

    })
  },

  add: function (req, res) {
    RequestManagerService.setRequest(req).setResponse(res).valid({
			"Tous les champs ne sont pas remplis ou mal remplis.": [
				['version', ''],
				['type', ''],
        {
          field: 'type',
          in: ['CHOICE', 'FORCED'],
          error: ''
        },
        ['state', ''],
        {
          field: 'state',
          in: ['STAGING', 'DEVELOPMENT', 'SNAPSHOT', 'RELEASE'],
          error: ''
        },
        ['visible', ''],
        {
          field: 'visible',
          in: [true, false],
          error: ''
        }
			]
		}, function () {

      // handle changelog
      var changelog = []
      for (var index in req.body.changelog) {
        changelog.push(req.body.changelog[index])
      }

      // update
      Version.create({
        version: req.body.version,
        type: req.body.type,
        state: req.body.state,
        visible: req.body.visible,
        releaseDate: (req.body.releaseDate) ? req.body.releaseDate : null,
        changelog: {
          "fr_FR": changelog
        }
      }).exec(function (err, versionUpdated) {

        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        NotificationService.success(req, req.__('La version a bien été enregistrée !'))

        res.json({
          status: true,
          msg: req.__('La version a bien été enregistrée !'),
          inputs: {}
        })

      })

    })
  },

  edit: function (req, res) {
    // Get id
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    // find
    Version.findOne({id: id}).exec(function (err, version) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // handle changelog
      var changelog = []
      for (var index in req.body.changelog) {
        changelog.push(req.body.changelog[index])
      }

      // update
      Version.update({id:id}, {
        version: req.body.version,
        type: req.body.type,
        state: req.body.state,
        visible: req.body.visible,
        releaseDate: (req.body.releaseDate) ? req.body.releaseDate : null,
        changelog: {
          "fr_FR": changelog
        }
      }).exec(function (err, versionUpdated) {

        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        res.json({
          status: true,
          msg: req.__('La version a bien été modifiée !'),
          inputs: {}
        })

      })

    })
  }

}
