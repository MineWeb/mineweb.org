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

    state: {
      type: 'string',
      in: ['STAGING', 'DEVELOPMENT', 'SNAPSHOT', 'RELEASE'],
      defaultsTo: 'DEVELOPMENT'
    },

    releaseDate: {
			type: 'datetime'
		},

    changelog: {
      type: 'json'
    }

  },

  /*
    Récupère la dernière version disponible au public du CMS
    Execute le callback passé en 1er paramètre en lui passant : *.*.* ou undefined.
  */
	getLastVersion: function(callback) {
		Version.findOne({is: 'RELEASE'}).sort('id DESC').exec(function(err, version) {
    	if (err) {
      	sails.log.error(err);
        return callback(undefined);
      }
      return callback(version.version)
    });
	}
};
