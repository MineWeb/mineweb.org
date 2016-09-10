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
  }

}
