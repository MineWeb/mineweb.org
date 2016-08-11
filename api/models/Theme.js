/**
 * Theme.js
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

		slug: {
			type: 'string',
			unique: true,
			required: true,
		},

		name: {
			type: 'string',
			unique: true,
			required: true
		},

		author: {
			model: 'User',
			required: true
		},

		description: {
			type: 'string',
			required: true
		},

		img: {
			type: 'string',
			url: true,
			required: true
		},

		version: {
			type: 'json',
			required: true
		},

		dependencies: {
			type: 'json',
			defaultsTo: { 'CMS': "1.0.0" }
		},

		official: {
			type: 'boolean',
			defaultsTo: false
		},

		downloads: {
			type: 'number',
			defaultTo: 0
		},

		price: {
			type: 'number',
			defaultsTo: 0
		}
  }
};

