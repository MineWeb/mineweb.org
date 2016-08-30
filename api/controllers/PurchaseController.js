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

	}

};
