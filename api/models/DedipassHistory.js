/**
 * DedipassHistory.js
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

    user: {
			model: 'User',
			required: true
		},

    code: {
      type: 'string',
      size: 8,
      required: true
    },

    rate: {
      type: 'string',
      size: 30,
      required: true
    },

    payout: {
      type: 'float',
      required: true
    },

    /*amount: {
      type: 'float',
      required: true
    },*/

    purchase: {
      model: 'Purchase'
    }

  }
};
