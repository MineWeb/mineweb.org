/**
 * Question.js
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

    question: {
      type: 'string',
      required: true
    },

    answer: {
      type: 'text',
      required: true
    },

    locale: {
      type: 'string',
      in: ['fr_FR', 'en_US', 'en_UK'],
      size: 5
    }

  }
};
