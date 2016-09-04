/**
 * Purchase.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var async = require('async')

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
      in: ['PAYPAL', 'DEDIPASS', 'FREE']
    }

  },

  findAllOfUser: function (userId, next) {

    // Find all
    Purchase.find({user: userId}).exec(function (err, purchases) {

      if (err)
        return next(err)

      // set vars
      var result = []
      result.plugin = []
      result.theme = []
      result.license = []
      result.hosting = []

      // no purchases
      if (purchases === undefined)
        return next(null, result)

      // foreach
      async.forEach(purchases, function (purchase, callback) {

        async.parallel([
          // get payment
          function (callback) {

            if (purchase.paymentType === 'PAYPAL' || purchase.paymentType === 'DEDIPASS') {

              var model = (purchase.paymentType === 'PAYPAL') ? PayPalHistory : DedipassHistory

              model.findOne({id: purchase.paymentId}).exec(function (err, payment) {
                delete model

                if (err)
                  return callback(err)

                return callback(null, payment)
              })

            }
            else {
              return callback(null, [])
            }

          },
          // get item
          function (callback) {

            // setup model
            switch (purchase.type) {
              case 'LICENSE':
                var model = License
                break;
              case 'HOSTING':
                var model = Hosting
                break;
              case 'PLUGIN':
                var model = Plugin
                break;
              case 'THEME':
                var model = Theme
                break;
              default:
                return callback(new Error('Purchase type not found'))
            }

            // find item
            model.findOne({id: purchase.itemId}).exec(function (err, item) {
              delete model

              if (err)
                return callback(err)

              return callback(null, item)
            })

          }
        ], function(err, results) {

          if (err)
            return next(err)

          purchase.payment = results[0]
          purchase.item = results[1]
          result[purchase.type.toLowerCase()].push(purchase)

          callback()

        })

      }, function () {
        next(null, result)
      })


    })


  }

};
