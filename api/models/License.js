/**
 * License.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
		id : {
			type: 'number',
			required: true,
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
			required: true,
			uuidv4: true
		},
		state: {
			type: 'boolean',
			defaultsTo: true
		},
		host: {
			type: 'string',
			required: true,
			url: true
		},
		created: {
			type: 'datetime',
			defaultsTo: Date.now()
		},
		modified: {
			type: 'datetime'
		},
		lastestCheck: {
			type: 'string'
		},
		secretKey: {
			type: 'string',
			required: true,
			alphanumeric: true
		},
		suspended: {
			type: 'boolean',
			defaultsTo: false
		}
  }
};

