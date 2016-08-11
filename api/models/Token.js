/**
 * Token.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var uuid = require('node-uuid');

module.exports = {

  attributes: {
		id: {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

		user : {
			model: 'User',
			required: true
		},

    token: {
			type: 'string',
      unique: true,
			uuidv4: true,
      defaultsTo: function () {
				return uuid.v4();
			}
		},

		type: {
			type: 'string',
			required: true,
			in: ['VALIDATION', 'FORGOT'],
      size: 10
		},

		usedAt: {
			type: 'datetime'
		},

		usedLocation: {
			type: 'string',
			ip: true
		}
  }
};
