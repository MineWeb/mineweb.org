/**
 * License.js
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
		user: {
			model: 'User',
			required: true
		},
		key: {
			type: 'string',
			unique: true,
			uuidv4: true
		},
		state: {
			type: 'boolean',
			defaultsTo: true
		},
		host: {
			type: 'string',
      defaultsTo: null,
			url: true
		},
		secretKey: {
			type: 'string',
			defaultsTo: null,
			alphanumeric: true
		},
		suspended: {
			type: 'string',
			defaultsTo: null
		}
  }
};
