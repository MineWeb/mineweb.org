/**
 * TicketMessage.js
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

    ticket: {
      model: 'Ticket',
      defaultsTo: null,
      required: true
    },

    content: {
      type: 'text',
      required: true
    }

  }
};
