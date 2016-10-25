/**
 * Admin/ApiController
 *
 * @description :: Server-side logic for managing and view api (logs)
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var moment = require('moment')

module.exports = {

  log: function (req, res) {
    res.view('admin/api/log', {
      title: req.__("Logs de l'API")
    })
  },

  getLogs: function (req, res) {
    req.query.order = [{ column: 0, dir: 'desc'}]

    DataTablesService.datatable(ApiLog, req.query, function (err, logs) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // edit data
      var formattedData = []
      async.each(logs.data, function (log, callback) {
        if (log.license)
          log.license = '<a href="/admin/license/view/' + log.license + '"> ' + log.license + '</a>'
        else
          log.license = 'N/A'

        if (log.error)
          log.error = '<code>' + log.error + '</code>'
        else
          log.error = 'N/A'
        log.data = '<code>' + JSON.stringify(log.data) + '</code>'
        log.api_version = 'v' + log.api_version

        if (log.status)
          log.status = '<span class="label label-primary"> ' + req.__('Réussi') + '</span>'
        else
          log.status = '<span class="label label-danger"> ' + req.__('Échoué') + '</span>'

        log.createdAt = '<i class="fa fa-calendar"></i> ' + req.__('Le %s à %s', moment(log.createdAt).format('L'), moment(log.createdAt).format('LT'))

        formattedData.push(log)

        callback()
      }, function () {
        logs.data = formattedData
        return res.send(logs)
      })
    })
  },

  faq: function (req, res) {
    Faq.find().exec(function (err, questions) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      res.view('admin/api/faq', {
        title: req.__('Foire Aux Questions'),
        faq: questions
      })
    })
  },

  addQuestion: function (req, res) {
    RequestManagerService.setRequest(req).setResponse(res).valid({
			'Tous les champs ne sont pas remplis.': [
				['question', ''],
				['answer', ''],
        ['lang', '']
			]
		}, function () {
      Faq.create({question: req.body.question, answer: req.body.answer, lang: req.body.lang}).exec(function (err, question) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // send notification
        NotificationService.success(req, req.__('La question a bien été enregistrée !'))

        // send response to redirect
        res.json({
          status: true,
          msg: req.__('La question a bien été enregistrée !'),
          inputs: {}
        })
      })
    })
  },

  removeQuestion: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    Faq.destroy({id: id}).exec(function (err, questionDeleted) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // send notification
      NotificationService.success(req, req.__('La question a bien été supprimée !'))

      // send redirect
      res.redirect('/admin/api/faq')
    })
  },

  editQuestion: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    RequestManagerService.setRequest(req).setResponse(res).valid({
      'Tous les champs ne sont pas remplis.': [
				['question', ''],
				['answer', ''],
        ['lang', '']
      ]
    }, function () {
      Faq.update({id: id}, {question: req.body.question, answer: req.body.answer, lang: req.body.lang}).exec(function (err, questionUpdated) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // send response
        res.json({
          status: true,
          msg: req.__('La question a bien été enregistrée !'),
          inputs: {}
        })
      })
    })
  }

}
