/**
 * History.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

		id : {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

		action: {
			type: 'string',
			required: true,
			in: ['GET_PLUGIN', 'UPDATE', 'KEY_VERIFY', 'ADD_TICKET', 'GET_SECRET_KEY', 'GET_PLUGIN', 'GET_THEME', 'LOGIN', 'DEBUG', 'TRY_LOGIN', 'LOGIN', 'LOG_ACTION']
		},

		ip: {
			type: 'string',
			required: true,
			ip: true
		},

		status: {
			type: 'boolean',
			required: true
		},

		error: {
			type: 'string'
		},

		type: {
			type: 'string',
			required: true,
			in: ['LICENSE', 'HOSTING', 'USER']
		},

		data: {
			type: 'json'
		}
  }
};
