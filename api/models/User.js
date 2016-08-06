/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
		id : {
			type: 'number',
			required: true,
			unique: true
		},
		username: {
			type: 'string',
			required: true,
			unique: true
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
		money: {
			type: 'number',
			defaultsTo: 0.0
		},
		role: {
			type: 'string',
			defaultsTo: 'USER',
			in: ['USER', 'MOD', 'ADMIN', 'FOUNDER']
		},
		developer: {
			type: 'boolean',
			defaultsTo: false,
			boolean: true
		},
		ip: {
			type: 'string',
			ipv4: true
		},
		lang: {
			type: 'string',
			defaultsTo: 'fr'
		},
		created: {
			type: 'string',
			datetime: true
		},
		modified: {
			type: 'string',
			datetime: true
		},
		state: {
			type: 'string',
			defaultsTo: 'UNCONFIRMED',
			in: ['CONFIRMED', 'UNCONFIRMED']
		}
  }
};

