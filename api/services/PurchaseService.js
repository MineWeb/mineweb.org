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
   * @return Purchase ID or false
   * @param {integer} purchase.userId Buyer's id
   * @param {string} purchase.offerType Can be in ['PLUGIN', 'THEME', 'LICENSE', 'HOSTING']
   * @param (optionnal) {string} purchase.offerId Offer's id (Plugin/Theme id)
   * @param (optionnal) {float} purchase.amount Payment's amount (with fees for PayPal payment)
   * @param (optionnal) {string} purchase.receiver PayPal buyer's email
   * @param (optionnal) {string} purchase.voucher purchase.voucher code
   * @param (optionnal) {string} purchase.paymentType in ['PAYPAL', 'DEDIPASS']
   * @param (optionnal) {array} purchase.host Contains license/purchase.hosting purchase.host
   * @param {function} next Callback function
   *
   */

  buy: function (purchase, next) {

    var self = this

    if (purchase === undefined && typeof purchase !== 'object')
      return next(false)

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

            var model = (purchase.offerType === 'PLUGIN') ? Plugin : Hosting

            model.count({id: purchase.offerId}).populate(['author']).exec(function (err, offer) {

              if (err)
                callback(err, null)
              else
                callback(null, offer)

            })

          }
          else {
            callback(null, null)
          }

        }

      ], function (err, results) {

        // If error occured with sql
        if (err) {
          sails.log.error(err)
          return next(false)
        }

        // If user doesn't exist
        if (!results[0]) {
          sails.log.error("[PURCHASE] User doesn't exist")
          return next(false)
        }

        // If offer is a plugin or theme and doesn't exist
        if ( (purchase.offerType === 'PLUGIN' || purchase.offerType === 'THEME') && results[1] === undefined) {
          sails.log.error("[PURCHASE] Offer doesn't exist")
          return next(false)
        }
        else if (purchase.offerType === 'LICENSE') {
          offer = {
            price: License.price
          }
        }
        else if (purchase.offerType === 'HOSTING') {
          offer = {
            price: Hosting.price
          }
        }
        else {
          sails.log.error("[PURCHASE] Unknown offer type")
          return next(false)
        }

        // Set/delete vars
        var offer = results[1]
        delete results

        // Check purchase.receiver if paypal payment
        if (purchase.receiver !== undefined && purchase.paymentType == 'PAYPAL' && // If payment is PayPal
          (
            ( // If offer is Plugin/Theme and receiver isn't developer
              (purchase.offerType === 'PLUGIN' || purchase.offerType === 'THEME')
              &&
              purchase.receiver !== offer.user.paypalDeveloperEmail
            )
            || // Or it's a license/hostign and receiver isn't me
            (
              (purchase.offerType === 'LICENSE' || purchase.offerType === 'HOSTING')
              &&
              purchase.receiver !== sails.config.paypal.merchantEmail
            )
          )
        ) {
          sails.log.error("[PURCHASE] Bad receiver")
          return next(false)
        }

        /*
            Handle price
        */

          if (purchase.voucher === undefined)
            purchase.voucher = 'fake'

          // Check if purchase.voucher exist
          Voucher.findOne({code: purchase.voucher}).exec(function (err, voucher) {

            if (err) {
              sails.log.error(err)
              return next(false)
            }

            if (purchase.amount !== undefined) {

              // If purchase.voucher exist with this code
              if (voucher !== undefined) {
                // Calculate new price without purchase.voucher purchase.amount
                offer.price -= voucher.purchase.amount
              }

              // If it's paypal payment
              if (purchase.receiver !== undefined) {
                // Calculate fees if PayPal payment (if purchase.receiver !== undefined)
                offer.price = offer.price + PayPalService.calculateFees(offer.price)
              }

              // Check price with offer price
              if (purchase.amount !== offer.price) {
                sails.log.error("[PURCHASE] Price doesn't match !")
                return next(false)
              }

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
                    return next(false)
                  }

                  /*
                    Save
                  */

                  self.saveVoucher(voucher, purchase.userId, purchase.offerType, purchase.offerId, function (success) {

                    if (!success)
                      return next(false)

                    // Save & Return purchase ID
                      var save = self.save(purchase.userId, purchase.offerType, itemId, purchase.paymentType, function(success, purchaseId) {

                        if (!success)
                          return next(false)

                        return next(true, purchaseId, itemId)

                      })

                    })
                })

              } else {
                // For Theme/Plugins

                /*
                  Save
                */

                self.saveVoucher(voucher, purchase.userId, purchase.offerType, purchase.offerId, function (success) {

                  if (!success)
                    return next(false)

                  // Save & Return purchase ID
                    var save = self.save(purchase.userId, purchase.offerType, purchase.offerId, purchase.paymentType, function(success, purchaseId) {

                      if (!success)
                        return next(false)

                      return next(true, purchaseId, itemId)

                    })

                })

              }

          })

      })

  },

  /**
   * Handle save process (called by buy() method only)
  **/

  save: function (userId, offerType, itemId, paymentType, next) {
    // Save purchase
    Purchase.create({
      user: userId,
      type: offerType,
      itemId: itemId,
      paymentType: paymentType
    }).exec(function (err, purchase) {

      if (err) {
        sails.log.error(err)
        next(false)
      }

      // If it's License/purchase.hosting
      if (offerType === 'LICENSE' || offerType === 'HOSTING') {

        // Save purchase id into License/purchase.hosting entry
        var model = (offerType === 'LICENSE') ? License : Hosting
        model.update({id: itemId}, {purchase: purchase.id}).exec(function (err, item) {

          if (err) {
            sails.log.error(err)
            next(false)
          }

          // Return purchase id
          next(true, purchase.id)

        })

      } else {
        // It's Plugin/Theme
        next(true, purchase.id)
      }

    })
  },


  /*
    Handle voucher set to used process (called by buy() method only)
  */

  saveVoucher: function (voucher, userId, offerType, offerId, next) {

    if (voucher === undefined) // no voucher
      return next(true)

    Voucher.update({id: voucher.id}, {usedBy: userId, usedAt: (new Date()), usedLocation: req.ip, itemType: offerType, itemId: offerId}).exec(function (err, voucher) {

      if (err) {
        sails.log.error(err)
        return next(false)
      }

      return next(true)

    })

  }

};
