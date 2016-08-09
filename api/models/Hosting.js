/**
 * Hosting.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var uuid = require('node-uuid');

module.exports = {

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
      defaultsTo: function (){ return uuid.v4().substr(4, 24); }
		},
		state: {
			type: 'boolean',
			defaultsTo: true
		},
    host_type: {
			type: 'string',
			required: true,
      defaultsTo: 'SUBDOMAIN',
			in: ['SUBDOMAIN', 'DOMAIN']
		},
		host: {
			type: 'string',
      required: true
		},
		secretKey: {
			type: 'string',
			defaultsTo: null,
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
		suspended: {
			type: 'string',
			defaultsTo: null
		}
  }
};
