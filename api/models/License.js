/**
 * License.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var uuid = require('node-uuid');

module.exports = {

  price: 9.99,

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

		host: {
			type: 'string',
			url: true
		},

		secretKey: {
			type: 'string',
			alphanumeric: true
		},

		suspended: {
			type: 'text'
		},

    purchase: {
      model: 'Purchase'
    }

  },

  generate: function(userId, host, next) {
    // Save license
    License.create({
      user: userId,
      host: host
    }).exec(function (err, license) {

      if (err) {
        sails.log.error(err)
        return false
      }

      // Return license id
      return next(err, license.id)

    })
  }

};
