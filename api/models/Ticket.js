/**
 * Ticket.js
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

    license: {
      model: 'License',
      defaultsTo: null
    },

    hosting: {
      model: 'Hosting',
      defaultsTo: null
    },

    title: {
      type: 'string',
      required: true
    },

    category: {
      type: 'string',
      required: true,
      in: ['GENERAL', 'SERVER', 'DEVELOPMENT', 'SUGGESTION', 'QUESTION']
    },

    content: {
      type: 'string',
      required: true
    },

    state: {
      type: 'string',
      in: ['WAITING_STAFF_RESPONSE', 'WAITING_USER_RESPONSE', 'CLOSED'],
      defaultsTo: 'WAITING_STAFF_RESPONSE'
    },

    supported: {
      model: 'User',
      defaultsTo: null
    },

    closedDate: {
      type: 'datetime',
      defaultsTo: null
    }

  }
};
