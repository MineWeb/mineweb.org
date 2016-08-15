/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var crypto		= require('crypto');
var salt			= 'DR2G0FgaC9mYhGUubWwqyJfIxfs2vn93b0guVoii';

module.exports = {

  attributes: {

		id : {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

		username: {
			type: 'string',
			required: true,
			unique: true,
      min: 4,
      max: 25,
      size: 25
		},

		email: {
			type: 'string',
			required: true,
			unique: true
		},

		password: {
			type: 'string',
			required: true
		},

		role: {
			type: 'string',
			defaultsTo: 'USER',
			in: ['USER', 'DEVELOPER', 'MOD', 'ADMIN', 'FOUNDER'],
      size: 9
		},

		developer: {
			type: 'string',
			defaultsTo: 'NONE',
			in: ['NONE', 'CANDIDATE', 'CONFIRMED'],
      size: 9
		},

		ip: {
			type: 'string',
			ip: true
		},

		lang: {
			type: 'string',
			defaultsTo: 'fr-fr',
      size: 5
		},

    twoFactorAuthKey: {
      type: 'string',
      size: 100
    },

		tokens: {
			collection: 'Token',
			via: 'user'
		},

		hostings: {
			collection: 'Hosting',
			via: 'user'
		},

		licenses: {
			collection: 'License',
			via: 'user'
		},

		plugins: {
			collection: 'Plugin',
			via: 'author'
		},

		themes: {
			collection: 'Theme',
			via: 'author'
		},

    paypalPayments: {
			collection: 'PayPalHistory',
			via: 'user'
		},

		dedipassPayments: {
			collection: 'DedipassHistory',
			via: 'user'
		},

		toJSON: function() {
			var user = this.toObject();
			delete user.password;
			delete user.tokens;
			delete user.ip;
			//delete user.id;
			delete user.email;
			return user;
		}

  },

  hashPassword: function(password) {
    return crypto.createHash('sha1').update(salt + password).digest('hex')
  },

  /**
   *  Before creating an account, hash his password using salt
   */
  beforeCreate: function(user, callback) {
    user.password = this.hashPassword(user.password);
    callback();
  },

  /**
   *  Before updating an user, hash his password using salt
   */
  beforeUpdate: function(user, callback) {
    user.password = this.hashPassword(user.password);
    callback();
  }

};
