/**
 * Purchase.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var async	= require('async')

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
      type: 'string'
    },

    paymentType: {
      type: 'string',
      in: ['PAYPAL', 'DEDIPASS']
    }

  },

  /**
   * Handle buy process (plugin/theme/license/hosting)
   *
   * @description :: Handle the process after creditation, before add licence/theme/plugin/hosting
   *                 Check if user & offer exists
   *                 Calculate new price (voucher + fees for PayPal payment)
   *                 Check receiver email if not empty (PayPal payment)
   *                 Check price
   *                 Call hosting generation OR license generation (optionnal)
   *                 Save into purchase table data
   * @return Purchase ID or FALSE
   * @param {integer} userId Buyer's id
   * @param {string} offerType Can be in ['PLUGIN', 'THEME', 'LICENSE', 'HOSTING']
   * @param (optionnal) {string} offerId Offer's id (Plugin/Theme id)
   * @param {float} amount Payment's amount (with fees for PayPal payment)
   * @param (optionnal) {string} receiver PayPal buyer's email
   * @param (optionnal) {string} voucher Voucher code
   * @param (optionnal) {string} paypalPaymentId PayPal transaction id
   * @param (optionnal) {array} data Contains license/hosting host
   *
   */

  buy: function (userId, offerType, offerId, amount, receiver, voucher, paypalPaymentId, data) {

    /*
        Primary checks
    */

      async.parallel([

        // Check if user exist
        function (callback) {

          User.count({id: userId}).exec(function (err, user_exist) {
            if (err)
              callback(err, null)
            else
              callback(null, (user_exist > 0))
          })

        },

        // Check if offer exist
        function (callback) {

          // if it's a plugin or theme
          if (offerType === 'PLUGIN' || offerType === 'THEME') {

            var model = (offerType === 'PLUGIN') ? Plugin : Theme

            model.count({id: offerId}).populate(['author']).exec(function (err, offer) {

              if (err)
                callback(err, null)
              else
                callback(null, offer)

            })

          }

        }

      ], function (err, results) {

        // If error occured with sql
        if (err)
          sails.log.error(err)
          return false

        // If user doesn't exist
        if (!results[0])
          sails.error("[PURCHASE] User doesn't exist")
          return FALSE

        // If offer is a plugin or theme and doesn't exist
        if ( (offerType === 'PLUGIN' || offerType === 'THEME') && results[1] === undefined) {
          sails.error("[PURCHASE] Offer doesn't exist")
          return FALSE
        }
        else if (offerType === 'LICENSE') {
          offer = {
            price: License.price
          }
        }
        else if (offerType === 'THEME') {
          offer = {
            price: Hosting.price
          }
        }
        else {
          sails.error("[PURCHASE] Unknown offer type")
          return FALSE
        }

        // Set/delete vars
        var offer = results[1]
        delete results

        // Check receiver if paypal payment
        if (receiver !== undefined && receiver !== offer.user.paypalDeveloperEmail) {
          sails.error("[PURCHASE] Bad receiver")
          return FALSE
        }

        /*
            Handle price
        */

          // Check if voucher exist
          Voucher.findOne({code: voucher}).exec(function (err, voucher) {

            if (err)
              sails.log.error(err)
              return false

            // If voucher exist with this code
            if (voucher !== undefined) {
              // Calculate new price without voucher amount
              offer.price -= voucher.amount
            }

            // If it's paypal payment
            if (receiver !== undefined) {
              // Calculate fees if PayPal payment (if receiver !== undefined)
              offer.price = PayPalHistory.calculateFees(offer.price)
            }

            // Check price with offer price
            if (amount !== offer.price)
              sails.log.error("[PURCHASE] Price doesn't match !")
              return false

            /*
                Process
            */

              if (offerType === 'LICENSE' || offerType === 'HOSTING') {

                // Generate
                var model = (offerType === 'LICENSE') ? License : Hosting
                model.generate(userId, data.host, function (err, itemId) {

                  if (err)
                    sails.log.error(err)
                    return false

                    /*
                      Save
                    */

                    // Save & Return purchase ID
                      return this.save(userId, offerType, itemId, paypalPaymentId)

                })

              } else {
                // For Theme/Plugins

                /*
                  Save
                */

                // Save & Return purchase ID
                  return this.save(userId, offerType, offerId, paypalPaymentId)
              }

          })

      })

  },

  /**
   * Handle save process (called by buy() method only)
  **/

  save: function (userId, offerType, itemId, paypalPaymentId) {
    // Save purchase
    Purchase.create({
      user: userId,
      type: offerType,
      itemId: itemId,
      paymentId: paypalPaymentId,
      paymentType: (paypalPaymentId === undefined) ? 'DEDIPASS' : 'PAYPAL'
    }).exec(function (err, purchase) {

      if (err)
        sails.log.error(err)
        return false


      // If it's License/Hosting
      if (offerType === 'LICENSE' || offerType === 'HOSTING') {

        // Save purchase id into License/Hosting entry
        var model = (offerType === 'LICENSE') ? License : Hosting
        model.update({id: itemId}, {purchase: purchase.id}).exec(function (err, item) {

          if (err)
            sails.log.error(err)
            return false

          // Return purchase id
          return purchase.id

        })

      } else {
        // It's Plugin/Theme
        return purchase.id
      }

    })
  }

};
