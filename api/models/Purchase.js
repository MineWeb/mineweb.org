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
			in: ['PLUGIN', 'THEME', 'LICENSE', 'HOSTING'],
      size: 7
		},

    itemId: {
      type: 'integer',
      required: true
    },

    paymentId: {
      type: 'integer'
    },

    paymentType: {
      type: 'string',
      in: ['PAYPAL', 'DEDIPASS']
    }

  }

};
