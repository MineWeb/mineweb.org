/**
 * Pushbullet.js
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

    iden: {
      type: 'string',
      size: 32,
      required: true
    },

    modelName: {
      type: 'string',
      size: 20,
      required: true
    },

    modelId: {
			type: 'integer',
      required: true
		}

  }
};
