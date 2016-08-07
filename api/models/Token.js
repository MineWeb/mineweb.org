/**
 * Token.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
		id: {
			type: 'number',
			required: true,
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},
		user : {
			model: 'User',
			required: true
		},
		type: {
			type: 'string',
			required: true,
			in: ['VALIDATION', 'FORGOT']
		},
		createdAt: {
			type: 'datetime',
			defaultsTo: Date.now()
		},
		usedAt: {
			type: 'datetime'
		},
		usedLocation: {
			type: 'string',
			ipv4: true
		}
  }
};

