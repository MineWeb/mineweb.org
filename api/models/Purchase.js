/**
 * Purchase.js
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

    user : {
			model: 'User',
			required: true
		},

    type: {
			type: 'string',
			required: true,
			in: ['PLUGIN', 'THEME'],
      size: 6
		},

    item_id: {
      type: 'integer',
      required: true
    }

  }
};
