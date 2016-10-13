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

    DataTablesService.datatable(Log, req.query, function (err, logs) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // edit data
      var formattedData = []
      async.each(logs.data, function (log, callback) {
        if (log.license)
          log.license = '<a href="/admin/license/view/' + log.license + '"> ' + log.license + '</a>'

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
  }

}
