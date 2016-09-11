/**
 * Hosting.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var uuid = require('node-uuid')

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
      HostingService.create(hosting, function () {

        // Return hosting id
        return next(err, hosting.id)

      })

    })
  }

};
