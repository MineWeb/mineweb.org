/**
 * MailService
 *
 * @description :: Server-side logic formanaging purchases
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Services
 */

var async	= require('async')

module.exports = {

  /**
   * Handle buy process (plugin/theme/license/hosting)
   *
   * @description :: Handle the process after creditation, before add licence/theme/plugin/hosting
   *                 Check if user & offer exists
   *                 Calculate new price (purchase.voucher + fees for PayPal payment)
   *                 Check purchase.receiver email if not empty (PayPal payment)
   *                 Check price
   *                 Call hosting generation OR license generation (optionnal)
   *                 Save into purchase table data
   * @return Purchase ID or FALSE
   * @param {integer} purchase.userId Buyer's id
   * @param {string} purchase.offerType Can be in ['PLUGIN', 'THEME', 'LICENSE', 'HOSTING']
   * @param (optionnal) {string} purchase.offerId Offer's id (Plugin/Theme id)
   * @param {float} purchase.amount Payment's purchase.amount (with fees for PayPal payment)
   * @param (optionnal) {string} purchase.receiver PayPal buyer's email
   * @param (optionnal) {string} purchase.voucher purchase.voucher code
   * @param (optionnal) {string} purchase.paypalPaymentId PayPal transaction id
   * @param (optionnal) {array} purchase.host Contains license/purchase.hosting purchase.host
   *
   */

  buy: function (purchase) {

    if (purchase === undefined && typeof purchase !== 'object')
      return false

    /*
        Primary checks
    */

      async.parallel([

        // Check if user exist
        function (callback) {

          User.count({id: purchase.userId}).exec(function (err, user_exist) {
            if (err)
              callback(err, null)
            else
              callback(null, (user_exist > 0))
          })

        },

        // Check if offer exist
        function (callback) {

          // if it's a plugin or theme
          if (purchase.offerType === 'PLUGIN' || purchase.offerType === 'THEME') {

            var model = (purchase.offerType === 'PLUGIN') ? Plugin : Theme

            model.count({id: purchase.offerId}).populate(['author']).exec(function (err, offer) {

              if (err)
                callback(err, null)
              else
                callback(null, offer)

            })

          }

        }

      ], function (err, results) {

        // If error occured with sql
        if (err) {
          sails.log.error(err)
          return FALSE
        }

        // If user doesn't exist
        if (!results[0]) {
          sails.error("[PURCHASE] User doesn't exist")
          return FALSE
        }

        // If offer is a plugin or theme and doesn't exist
        if ( (purchase.offerType === 'PLUGIN' || purchase.offerType === 'THEME') && results[1] === undefined) {
          sails.error("[PURCHASE] Offer doesn't exist")
          return FALSE
        }
        else if (purchase.offerType === 'LICENSE') {
          offer = {
            price: License.price
          }
        }
        else if (purchase.offerType === 'THEME') {
          offer = {
            price: purchase.hosting.price
          }
        }
        else {
          sails.error("[PURCHASE] Unknown offer type")
          return FALSE
        }

        // Set/delete vars
        var offer = results[1]
        delete results

        // Check purchase.receiver if paypal payment
        if (purchase.receiver !== undefined && purchase.receiver !== offer.user.paypalDeveloperEmail) {
          sails.error("[PURCHASE] Bad purchase.receiver")
          return FALSE
        }

        /*
            Handle price
        */

          // Check if purchase.voucher exist
          Voucher.findOne({code: purchase.voucher}).exec(function (err, voucher) {

            if (err) {
              sails.log.error(err)
              return FALSE
            }

            // If purchase.voucher exist with this code
            if (voucher !== undefined) {
              // Calculate new price without purchase.voucher purchase.amount
              offer.price -= voucher.purchase.amount
            }

            // If it's paypal payment
            if (purchase.receiver !== undefined) {
              // Calculate fees if PayPal payment (if purchase.receiver !== undefined)
              offer.price = PayPalService.calculateFees(offer.price)
            }

            // Check price with offer price
            if (purchase.amount !== offer.price) {
              sails.log.error("[PURCHASE] Price doesn't match !")
              return FALSE
            }

            /*
                Process
            */

              if (purchase.offerType === 'LICENSE' || purchase.offerType === 'HOSTING') {

                // Generate
                var model = (purchase.offerType === 'LICENSE') ? License : Hosting
                model.generate(purchase.userId, purchase.host, function (err, itemId) {

                  if (err) {
                    sails.log.error(err)
                    return FALSE
                  }

                    /*
                      Save
                    */

                    // Save & Return purchase ID
                      return this.save(purchase.userId, purchase.offerType, itemId, purchase.paypalPaymentId)

                })

              } else {
                // For Theme/Plugins

                /*
                  Save
                */

                // Save & Return purchase ID
                  return this.save(purchase.userId, purchase.offerType, purchase.offerId, purchase.paypalPaymentId)
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

      if (err) {
        sails.log.error(err)
        return FALSE
      }

      // If it's License/purchase.hosting
      if (offerType === 'LICENSE' || offerType === 'HOSTING') {

        // Save purchase id into License/purchase.hosting entry
        var model = (offerType === 'LICENSE') ? License : Hosting
        model.update({id: itemId}, {purchase: id}).exec(function (err, item) {

          if (err) {
            sails.log.error(err)
            return FALSE
          }

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
