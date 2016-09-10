var async  = require('async')
var moment = require('moment')

module.exports = {

  create: function (hosting, next) {
    var id = (sails.config.environment === 'production') ? hosting.id : ('dev-' + hosting.id)
    var host = (sails.config.environment === 'production') ? hosting.host : ('dev-' + hosting.host)
    exec('/home/mineweb.sh creation ' + id + ' ' + host + ' sdomain', {
      user: sails.config.servers.hosting.user,
      host: sails.config.servers.hosting.host,
      port: sails.config.servers.hosting.port,
      password: sails.config.servers.hosting.password
    }, function (err, stdout, stderr) {

      if (err) {
        sails.log.error(err)
        return next()
      }

      var out = stdout.split("\n")
      try {
        var ids = JSON.parse(out[6])
      } catch (e) {
        sails.log.error(e)
      }

      if (ids && ids.status === 'success') {
        ids = ids.ftp
        //Save
        Hosting.update({id: hosting.id}, {ftpUser: ids.user, ftpPassword: ids.password}).exec(function (err, hosting) {
          if (err)
            sails.log.error(err)
          return next()
        })
      }

    })
  },

  disable: function (hosting, next) { // TODO

  },

  enable: function (hosting, next) { // TODO

  },

  delete: function (hosting, next) { // TODO

  },

  checkEnded: function () { // Called all days at 12h TODO

    async.parallel([

      /*
        Hosting ended today
      */
      function (callback) {
        // Find hosting with endDate <= now || endDate <= now + 12h && status == 1
        Hosting.find({
          or: [
            {
              endDate: {'<=': Date.now()}
            },
            {
              endDate: {'<=': moment().add(12, 'hours')}
            }
          ],
          status: true
        }).exec(function (err, hostings) {

          if (err)
            sails.log.error(err)

          if (hostings !== undefined) {
            for (var i = 0; i < hostings.length; i++) {

              // Disabled hosting (server)
              // Set status == 0 (db)
              HostingService.disable(hostings[i].id)
              Hosting.update({id: hostings[i].id}, {status: false}).exec(function (err, hosting) {
                if (err)
                  sails.log.error(err)

                // Send mail TODO
                // Save stats TODO

                callback()
              })

            }
          }
          else {
            callback()
          }

        })
      },

      /*
        Hosting ended in 7 days
      */
      function (callback) {

        // Find hosting with endDate :
          // ( >= now + 7 days at 00:00:00
          // &&
          // <= now + 7 days at 23:59:59 )
          // ||
          // ( >= now + 6 days at 00:00:00
          // &&
          // <= now + 6 days at 23:59:59 )
          // ||
          // ( >= now + 5 days at 00:00:00
          // &&
          // <= now + 5 days at 23:59:59 )
          // ||
          // ( >= now + 4 days at 00:00:00
          // &&
          // <= now + 4 days at 23:59:59 )
          // ||
          // ( >= now + 3 days at 00:00:00
          // &&
          // <= now + 3 days at 23:59:59 )
          // ||
          // ( >= now + 2 days at 00:00:00
          // &&
          // <= now + 2 days at 23:59:59 )
          // ||
          // ( >= now + 1 days at 00:00:00
          // &&
          // <= now + 1 days at 23:59:59 )

            // Send mail
            // Save stats

      },

      /*
        Delete site after 7 days of status == 0
      */
      function (callback) {

        // Find hosting with endDate <= now - 7 days && status == 0

          // Delete hosting (db)
          // Delete hosting (server)

      }

    ], function (results) {
      // End: Send stat mail
    })

  }

}
