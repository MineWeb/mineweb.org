/**
 * TicketMessage.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var autolinks = require('autolinks')
var Entities = require('html-entities').AllHtmlEntities
var htmlentities = new Entities()

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

  },

  // Lifecycle Callbacks
  beforeCreate: function(values, next) {
    values.content = htmlentities.encode(values.content) // prevent xss
    values.content = autolinks(values.content.replace("\n", '<br>')) // autolinks + br
    next();
  }

};
