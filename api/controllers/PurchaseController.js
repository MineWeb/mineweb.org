/**
 * PurchaseControllerController
 *
 * @description :: Server-side logic for managing Purchasecontrollers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	/*
		Called by AJAX with voucherCode (arg)
	*/
	checkVoucher: function (req, res) {

		if (req.param('voucherCode') === undefined) {
			return res.notFound('Voucher code is missing')
		}
		var voucherCode = req.param('voucherCode')

		if (req.param('price') === undefined) {
			return res.notFound('Price is missing')
		}
		var price = parseFloat(req.param('price'))

		Voucher.findOne({code: voucherCode, usedAt: null, usedLocation: null}).exec(function (err, voucher) {

			if (err) {
				sails.log.error(err)
        return res.serverError('An error occured on voucher select')
			}

			if (voucher === undefined)
				return res.notFound('Voucher not found or already used')

			voucher.amount = parseFloat(voucher.amount)

			// Calcul PayPal fees
			var newPrice = price - voucher.amount
			if (newPrice > 0) {
				var fees = PayPalService.calculateFees(newPrice)
				newPrice = newPrice + fees
			}
			else {
				var fees = 0

				if (newPrice < 0)
					newPrice = 0

			}

			return res.json({
				status: true,
				voucher: {
					amount: voucher.amount,
					code: voucher.code
				},
				newPrice: newPrice,
				paypalFees: fees
			})

		})

	},

	/*
		Handle redirection to PayPal with form for PayPal process
	*/
	paypal: function (req, res) {

		// Handle params
			if (req.body.voucher === undefined || req.body.offer === undefined)
				return res.notFound('Params are missing')
			if (req.body.offer != 'license' && req.body.offer != 'hosting')
				return res.notFound('Unknown offer')

		// Get params
			var voucherCode = req.body.voucher
			var offer = req.body.offer

		// Setup model & get price
			var model = (offer == 'license') ? License : Hosting
			var price = model.price

		// Check voucher
			Voucher.findOne({code: voucherCode, usedAt: null, usedLocation: null}).exec(function (err, voucher) {

				if (err) {
					sails.log.error(err)
	        return res.serverError('An error occured on voucher select')
				}

				// If voucher exist and not used
				if (voucher !== undefined)
					price -= parseFloat(voucher.amount)

				if (price <= 0)
					return res.serverError("Can't buy free offer")

				// Calculate fees
				var fees = PayPalService.calculateFees(price)

				// Generate post data
				var item_name = (offer == 'license') ? req.__("Achat d'une licence MineWeb") : req.__("Location d'une licence et d'un hébergement MineWeb pour 1 mois")
				var data = { // Form PayPal values
					tax: fees,
					return_url: RouteService.getBaseUrl() + '/buy/paypal/success',
					cancel_return: RouteService.getBaseUrl() + '/purchase/' + offer,
					notify_url: RouteService.getBaseUrl() + '/api/paypal-ipn',
					business: 'paypal@mineweb.org',
					item_name: item_name,
					custom: JSON.stringify({
						voucher: voucherCode,
						userId: req.session.userId
					}),
					invoice: offer,
					amount: price,
					cbt: req.__('Retourner sur mineweb.org')
				}

				// Render view
				res.locals.title = req.__("Redirection vers PayPal")
				res.view('./buy/paypal', data)

			})

	},

	/*
		Display success page after paypal buy
	*/
	paypalSuccessPage: function (req, res) {
		res.locals.title = req.__("Merci !")
		res.view('./buy/paypal_success')
	},

	/*
		Handle dedipass form
	*/
	dedipass: function (req, res) {
		// Handle params
			if (req.body.offer === undefined)
				return res.notFound('Param are missing')
			if (req.body.offer != 'license' && req.body.offer != 'hosting')
				return res.notFound('Unknown offer')

			var offer = req.body.offer

		// Handle dedipass pubic key
			var dedipassPublicKey = (offer == 'license') ? sails.config.dedipass.publicKeys.license : sails.config.dedipass.publicKeys.hosting

		// Render view
		res.view('./buy/dedipass', {
			title: req.__("Payer avec Dédipass"),
			dedipassPublicKey: dedipassPublicKey,
			custom: offer
		})
	},

	/*
		Handle PayPal check after buy with IPN POSTed data
	*/
	paypalIPN: function (req, res) {

	},

	/*
		Handle dedipass check after buy
	*/
	dedipassIPN: function (req, res) {

	}

};
