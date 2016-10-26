var async  = require('async')
var moment = require('moment')
var exec = require('ssh-exec')
var uuid = require('node-uuid')

module.exports = {

  create: function (hosting, license_id, host, next) {
    var id = (sails.config.environment === 'production') ? hosting.id : ('dev-' + hosting.id)
    var host = (sails.config.environment === 'production') ? host : ('dev-' + host)

    exec('/home/mineweb.sh creation ' + id + ' ' + host + ' sdomain ' + license_id, {
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
            return sails.log.error(err)
          return next()
        })
      }

    })
  },

  disable: function (hosting, next) {
    var id = (sails.config.environment === 'production') ? hosting.id : ('dev-' + hosting.id)

    if (next === undefined)
      var next = function () {}

    exec('/home/mineweb.sh suspension ' + id, {
      user: sails.config.servers.hosting.user,
      host: sails.config.servers.hosting.host,
      port: sails.config.servers.hosting.port,
      password: sails.config.servers.hosting.password
    }, function (err, stdout, stderr) {
      if (err) {
        sails.log.error(err)
        return next()
      }

      next()

    })
  },

  enable: function (hosting, next) {
    var id = (sails.config.environment === 'production') ? hosting.id : ('dev-' + hosting.id)

    if (next === undefined)
      var next = function () {}

    exec('/home/mineweb.sh activation ' + id, {
      user: sails.config.servers.hosting.user,
      host: sails.config.servers.hosting.host,
      port: sails.config.servers.hosting.port,
      password: sails.config.servers.hosting.password
    }, function (err, stdout, stderr) {
      if (err) {
        sails.log.error(err)
        return next()
      }

      next()

    })
  },

  delete: function (hosting, next) {
    var id = (sails.config.environment === 'production') ? hosting.id : ('dev-' + hosting.id)

    if (next === undefined)
      var next = function () {}

    exec('/home/mineweb.sh suppression ' + id, {
      user: sails.config.servers.hosting.user,
      host: sails.config.servers.hosting.host,
      port: sails.config.servers.hosting.port,
      password: sails.config.servers.hosting.password
    }, function (err, stdout, stderr) {
      if (err) {
        sails.log.error(err)
        return next()
      }

      next()

    })
  },

  editHost: function (id, host, hostType, next) {
    id = (sails.config.environment === 'production') ? id : ('dev-' + id)
    host = (sails.config.environment === 'production') ? host : ('dev-' + host)

    if (next === undefined)
      var next = function () {}

    hostType = (hostType == 'domain') ? 'domain' : 'sdomain'

    exec('/home/mineweb.sh modif ' + id + ' ' + host + ' ' + hostType, {
      user: sails.config.servers.hosting.user,
      host: sails.config.servers.hosting.host,
      port: sails.config.servers.hosting.port,
      password: sails.config.servers.hosting.password
    }, function (err, stdout, stderr) {
      if (err) {
        sails.log.error(err)
        return next(err)
      }

      next()

    })
  },

  /*getLogs: function (hosting, next) {
    var id = (sails.config.environment === 'production') ? hosting.id : ('dev-' + hosting.id)

    if (next === undefined)
      var next = function () {}

    async.parallel([

      function (callback) {
        exec('cat /home/mineweb/user_dev-' + id + '/app/tmp/logs/error.log', {
          user: sails.config.servers.hosting.user,
          host: sails.config.servers.hosting.host,
          port: sails.config.servers.hosting.port,
          password: sails.config.servers.hosting.password
        }, function (err, stdout, stderr) {
          callback(err, stdout)
        }}
      },

      function (callback) {
        exec('cat /home/mineweb/user_dev-' + id + '/error.log', {
          user: sails.config.servers.hosting.user,
          host: sails.config.servers.hosting.host,
          port: sails.config.servers.hosting.port,
          password: sails.config.servers.hosting.password
        }, function (err, stdout, stderr) {
          callback(err, stdout)
        }}
      },

      function (callback) {
        exec('cat /home/mineweb/user_dev-' + id + '/access.log', {
          user: sails.config.servers.hosting.user,
          host: sails.config.servers.hosting.host,
          port: sails.config.servers.hosting.port,
          password: sails.config.servers.hosting.password
        }, function (err, stdout, stderr) {
          callback(err, stdout)
        }}
      }

    ], function (err, logs) {

      if (err)
        sails.log.error(err)

      next(err, {
        'app/tmp/logs/error.log': logs[0],
        'error.log': logs[1],
        'access.log': logs[2]
      })
    })
  },

  getSQLDump: function (hosting, next) {
    var id = (sails.config.environment === 'production') ? hosting.id : ('dev-' + hosting.id)

    if (next === undefined)
      var next = function () {}

    var date = d.getDate() + '-' + d.getMonth() + '-' + d.getFullYear() + '_' + d.getHours() + '-' + d.getMinutes()
    var sql_file = '/var/www/sql/' + uuid.v4() + '-' + hosting.id + '/' + date + '.sql'

    // dump
    exec('cp /home/mineweb/user_dev-' + id + '/app/tmp/logs/error.log', {
      user: sails.config.servers.hosting.user,
      host: sails.config.servers.hosting.host,
      port: sails.config.servers.hosting.port,
      password: sails.config.servers.hosting.password
    }, function (err, stdout, stderr) {
      callback(err, stdout)
    }}
  },*/

  checkEnded: function () { // Called all days at 12h

    console.log('Check licensesHosted')

    async.parallel([

      /*
        Hosting ended today
      */
      function (callback) {
        // Find hosting with expireAt <= now || expireAt <= now + 12h && state == 1
        License.find({
          expireAt: {'<=': moment().hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')},
          state: true,
          hosting: {'!': null}
        }).populate(['user', 'hosting']).exec(function (err, licensesHosted) {
          if (err)
            sails.log.error(err)

          if (licensesHosted !== undefined && licensesHosted.length > 0) {
            var licensesHostedDisabled = 0
            async.forEach(licensesHosted, function (license, next) {
              var hosting = license.hosting
              // Disabled hosting (server)
              // Set state == 0 (db)
              HostingService.disable(hosting)
              License.update({hosting: hosting.id}, {state: false}).exec(function (err, licenseUpdated) {
                if (err)
                  sails.log.error(err)

                // Send mail
                sails.config.i18n = license.user.lang.split('-')[0]
                MailService.send('hostings/disable', {
                  host: (hosting.hostType === 'SUBDOMAIN') ? 'http://' + license.host + '.craftwb.fr' : 'http://' + license.host,
                  url: RouteService.getBaseUrl() + '/hosting/renew/' + hosting.id,
                  username: license.user.username
                }, sails.__('Désactivation de votre licence hébergée'), license.user.email)
                // Save stats
                licensesHostedDisabled++
                next()
              })
            }, function () {
              callback(null, licensesHostedDisabled)
            })
          }
          else {
            callback(null, 0)
          }
        })
      },

      /*
        Hosting ended in 7 days
      */
      function (callback) {
        // Find hosting
          License.find({
            or: [
              {
                expireAt: {'>=': moment().add(7, 'days').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss'), '<=': moment().add(7, 'days').hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')}
              },
              {
                expireAt: {'>=': moment().add(6, 'days').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss'), '<=': moment().add(6, 'days').hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')}
              },
              {
                expireAt: {'>=': moment().add(5, 'days').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss'), '<=': moment().add(5, 'days').hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')}
              },
              {
                expireAt: {'>=': moment().add(4, 'days').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss'), '<=': moment().add(4, 'days').hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')}
              },
              {
                expireAt: {'>=': moment().add(3, 'days').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss'), '<=': moment().add(3, 'days').hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')}
              },
              {
                expireAt: {'>=': moment().add(2, 'days').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss'), '<=': moment().add(2, 'days').hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')}
              },
              {
                expireAt: {'>=': moment().add(1, 'days').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss'), '<=': moment().add(1, 'days').hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss')}
              }
            ],
            state: true,
            hosting: {'!': null}
          }).populate(['user', 'hosting']).exec(function (err, licensesHosted) {
            if (err)
              sails.log.error(err)

            if (licensesHosted !== undefined && licensesHosted.length > 0) {
              var licensesHostedLastDays = 0
              async.forEach(licensesHosted, function (license, next) {
                var hosting = license.hosting
                // Send mail
                sails.config.i18n = license.user.lang.split('-')[0]
                MailService.send('hostings/lastDays', {
                  host: (hosting.hostType === 'SUBDOMAIN') ? 'http://' + license.host + '.craftwb.fr' : 'http://' + license.host,
                  url: RouteService.getBaseUrl() + '/hosting/renew/' + hosting.id,
                  days: Math.floor(Math.abs( (new Date(license.expireAt) - Date.now()) / (24 * 60 * 60 * 1000) )),
                  username: license.user.username
                }, sails.__('Expiration de votre licence hébergée'), license.user.email)

                // Save stats
                licensesHostedLastDays++
                next()
              }, function () {
                callback(null, licensesHostedLastDays)
              })
            }
            else {
              callback(null, 0)
            }
          })
      },

      /*
        Delete site after 7 days of state == 0
      */
      function (callback) {
        // Find hosting with expireAt <= now - 7 days && state == 0
        License.find({
          expireAt: {'<=': moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss')},
          state: false,
          hosting: {'!': null}
        }).populate(['user', 'hosting']).exec(function (err, licensesHosted) {
          if (err)
            sails.log.error(err)

          if (licensesHosted !== undefined && licensesHosted.length > 0) {
            var licensesHostedDeleted = 0
            async.forEach(licensesHosted, function (license, next) {
              var hosting = license.hosting
              // Delete hosting (server && db)
              HostingService.delete(hosting)
              Hosting.destroy({id: hosting.id}).exec(function (err, hostingDestroyed) {
                if (err)
                  sails.log.error(err)

                License.destroy({hosting: hosting.id}).exec(function (err, licenseDestroyed) {
                  if (err)
                    sails.log.error(err)

                  // Save stats
                  licensesHostedDeleted++
                  next()
                })
              })
            }, function () {
              callback(null, licensesHostedDeleted)
            })
          }
          else {
            callback(null, 0)
          }
        })
      }

    ], function (err, results) {
      // Group stats
      var stats = {
        hostingsDisabled: results[0],
        hostingsLastDays: results[1],
        hostingsDeleted: results[2]
      }

      // Send stats mail
      MailService.send('stats/hostings', {
        stats: stats
      }, sails.__('Statistiques des licences hébergées'), sails.config.stats.email)

      console.log('Hostings checked!', stats)

    })

  }

}
