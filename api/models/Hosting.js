/**
 * Hosting.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var uuid = require('node-uuid')
var exec = require('ssh-exec')

module.exports = {

  price: 1.5,

  attributes: {

		id : {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

		user: {
			model: 'User',
			required: true
		},

		key: {
			type: 'string',
			unique: true,
      defaultsTo: function () {
				return uuid.v4().substr(4, 24);
			},
      size: 19
		},

		state: {
			type: 'boolean',
			defaultsTo: true
		},

    hostType: {
			type: 'string',
			required: true,
      defaultsTo: 'SUBDOMAIN',
			in: ['SUBDOMAIN', 'DOMAIN'],
      size: 9
		},

		host: {
			type: 'string',
      required: true
		},

		secretKey: {
			type: 'string',
			alphanumeric: true
		},

    endDate: {
			type: 'datetime',
      defaultsTo: function () {
        var d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d;
      }
		},

    ftpUser: {
      type: 'string'
    },

    ftpPassword: {
      type: 'string'
    },

		suspended: {
			type: 'text',
			defaultsTo: null
		},

    purchase: {
      model: 'Purchase'
    }

  },

  generate: function(userId, host, next) {
    // Save hosting
    Hosting.create({
      user: userId,
      host: host
    }).exec(function (err, hosting) {

      if (err) {
        sails.log.error(err)
        return false
      }

      // Send command to server for generate hosting
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
          return false
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
          })
        }

        // Return hosting id
        return next(err, hosting.id)

      })

    })
  }

};
