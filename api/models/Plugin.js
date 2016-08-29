/**
 * Plugin.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

		id: {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

		slug: {
			type: 'string',
			unique: true,
			required: true,
      min: 5,
      max: 20,
      size: 20
		},

		author: {
			model: 'User',
			required: true
		},

		description: {
			type: 'text',
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

		requirements: {
			type: 'json',
			defaultsTo: { 'CMS': "1.0.0" }
		},

		official: {
			type: 'boolean',
			defaultsTo: false
		},

		downloads: {
			type: 'integer',
			defaultTo: 0
		},

		price: {
			type: 'float',
			defaultsTo: 0
		}
  },

  retrieveVersion : function (model) {
    if (!model.versions)
      return 'none'
    
    var sorted = Object.keys(model.versions).sort(Utils.compareVersion);
    return sorted[sorted.length - 1];
  },

  beforeUpdate: function (plugin, cb) {
    plugin.version = retrieveVersion(plugin);
    cb()
  }
};
