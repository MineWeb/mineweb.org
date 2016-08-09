/**
 * Version.js
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

    version : {
      type: 'string',
      required: true,
      unique: true,
      regex: /^(\d+\.)?(\d+\.)?(\*|\d+)$/
    },

    type: {
      type: 'string',
      in: ['CHOICE', 'FORCED'],
      defaultsTo: 'CHOICE'
    },

    visible: {
      type: 'boolean',
      defaultsTo: false
    },

    is: {
      type: 'string',
      in: ['SNAPSHOT', 'RELEASE'],
      defaultsTo: 'SNAPSHOT'
    },

    releaseDate: {
			type: 'datetime'
		},

    changelog: {
      type: 'json',
      defaultsTo: null
    }

  }
};
