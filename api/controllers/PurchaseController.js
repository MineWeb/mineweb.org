/**
 * PurchaseControllerController
 *
 * @description :: Server-side logic for managing Purchasecontrollers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var request = require('request')
var paypalIPN = require('paypal-ipn')

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
		Called by AJAX with subdomain (arg)
	*/
	checkHostingSubdomainAvailability: function (req, res) {

		// Handle args
		if (req.param('subdomain') === undefined) {
			return res.notFound('Subdomain is missing')
		}
		var subdomain = req.param('subdomain')

		// Check subdomain
		Hosting.count({host: subdomain, hostType: 'SUBDOMAIN'}).exec(function (err, count) {

			if (err) {
				sails.log.error(err)
				return res.serverError('An error occured on dedipass api')
			}

			if (count > 0) {
				return res.json({
					status: true,
					available: false
				})
			}

			return res.json({
				status: true,
				available: true
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
					return res.redirect('/purchase/' + offer + '/free/' + voucherCode + '/' + req.body.custom)

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
						userId: req.session.userId,
						custom: req.body.custom
					}),
					invoice: offer,
					amount: price,
					cbt: req.__('Retourner sur mineweb.org')
				}

				// Render view
				res.locals.title = req.__("Redirection vers PayPal")

				// Check host (for hosting)
					if (offer == 'hosting') {

						if (req.body.custom === undefined || req.body.custom.length == 0) {
							NotificationService.error(req, req.__('Vous devez choisir un sous-domaine !'))
							return res.redirect('/purchase/hosting')
						}

						Hosting.count({host: req.body.custom, hostType: 'SUBDOMAIN'}).exec(function (err, count) {

							if (err) {
								sails.log.error(err)
								return res.serverError('An error occured on dedipass api')
							}

							if (count > 0) {
								NotificationService.error(req, req.__('Vous devez choisir un sous-domaine disponible !'))
								return res.redirect('/purchase/hosting')
							}

							res.view('./buy/paypal', data)

						})

					}
					else { // Not hosting
						res.view('./buy/paypal', data)
					}

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

		// Check host (for hosting)
			if (offer == 'hosting') {

				if (req.body.custom === undefined || req.body.custom.length == 0) {
					NotificationService.error(req, req.__('Vous devez choisir un sous-domaine !'))
					return res.redirect('/purchase/hosting')
				}

				Hosting.count({host: req.body.custom, hostType: 'SUBDOMAIN'}).exec(function (err, count) {

					if (err) {
						sails.log.error(err)
						return res.serverError('An error occured on dedipass api')
					}

					if (count > 0) {
						NotificationService.error(req, req.__('Vous devez choisir un sous-domaine disponible !'))
						return res.redirect('/purchase/hosting')
					}

					// Handle dedipass pubic key
						var dedipassPublicKey = (offer == 'license') ? sails.config.dedipass.publicKeys.license : sails.config.dedipass.publicKeys.hosting

					// Render view
					res.view('./buy/dedipass', {
						title: req.__("Payer avec Dédipass"),
						dedipassPublicKey: dedipassPublicKey,
						custom: req.body.custom
					})

				})
			}
			else { // Not hosting, licence

				// Handle dedipass pubic key
					var dedipassPublicKey = (offer == 'license') ? sails.config.dedipass.publicKeys.license : sails.config.dedipass.publicKeys.hosting

				// Render view
				res.view('./buy/dedipass', {
					title: req.__("Payer avec Dédipass"),
					dedipassPublicKey: dedipassPublicKey,
					custom: req.body.custom
				})

			}
	},

	/*
		Handle PayPal check after buy with IPN POSTed data
	*/
	paypalIPN: function (req, res) {
		paypalIPN.verify(req.body, {'allow_sandbox': sails.config.paypal.sandbox}, function (err, msg) {

		  if (err) {
		    sails.log.error(err);
		  } else {

		    if (req.body.payment_status == 'Completed') {
						// set voucher at used
		    }

		  }

		})
	},

	/*
		Handle dedipass check after buy
	*/
	dedipassIPN: function (req, res) {

		// Check params
		if (req.body.code === undefined || req.body.code.length === 0 || req.body.rate === undefined || req.body.rate.length === 0) {
			NotificationService.error(req, req.__('Vous devez entrer un code et/ou choisir une offre !'))
			res.redirect('/download')
		}

		// Check offer
		if (req.body.key === sails.config.dedipass.publicKeys.license)
			var offer = 'license'
		else if (req.body.key === sails.config.dedipass.publicKeys.hosting)
			var offer = 'hosting'
		else
			res.serverError()

		// Set vars
		var code = req.body.code
		var rate = req.body.rate

		// Create endpoint
		var endpoint = 'http://api.dedipass.com/v1/pay/?key=' + sails.config.dedipass.publicKeys[offer] + '&rate=' + rate + '&code=' + code

		// Request
		request.get({
      url: endpoint,
			json: true
    }, function(err, response, body) {

			if (err) {
				sails.log.error(err)
				return res.serverError('An error occured on dedipass api')
			}

			// If success payment
			if (body.status == 'success') {

				// re-set vars (clean)
				code = body.code
				rate = body.rate

				// save purchase
				PurchaseService.buy({
					userId: req.session.userId,
					offerType: offer.toUpperCase(),
					host: req.body.custom,
					paymentType: 'DEDIPASS'
				}, function (success, purchaseId) {

					if (success) {

						// save dedipass payment
						DedipassHistory.create({
							user: req.session.userId,
							code: code,
							rate: rate,
							payout: body.payout,
							purchase: purchaseId
						}).exec(function (err, history) {

							if (err) {
								sails.log.error(err)
								return res.serverError('An error occured on dedipass api')
							}

							// set payment id of purchase
							Purchase.update({id: purchaseId}, {paymentId: history.id}).exec(function (err, purchase) {

								if (err) {
									sails.log.error(err)
									return res.serverError('An error occured on dedipass api')
								}

								// Redirect on profile with notification
								NotificationService.success(req, req.__('Vous avez bien payé et reçu votre produit !'))
								res.redirect('/user/profile')

							})

						})

					}
					else {
						return res.serverError('An error occured on purchase')
					}

				})

			}
			else {
				// invalid code
				NotificationService.error(req, req.__('Votre code "%s" est invalide !', code))
				res.redirect('/purchase/'+offer)
			}

		})

	},

	/*
		Handle free buy
	*/

	getFree: function (req, res) {

		// Handle params
		if (req.param('offer') === undefined) {
			return res.notFound('Offer is missing')
		}
		var offer = req.param('offer')

		if (req.param('voucherCode') === undefined) {
			return res.notFound('Voucher code is missing')
		}
		var voucherCode = req.param('voucherCode')

		var custom = (req.params[0] !== undefined && req.params[0].length > 0 && req.params[0] != 'undefined') ? req.params[0] : undefined

		// Check if voucher is valid
		Voucher.findOne({code: voucherCode, usedAt: null, usedLocation: null}).exec(function (err, voucher) {

			if (err) {
				sails.log.error(err)
				return res.serverError('An error occured on voucher check')
			}

			if (voucher === undefined) {
				NotificationService.error(req, req.__('Votre code promotionnel est incorrect !'))
				return res.redirect('/purchase/hosting')
			}

			// Handle host for hosting
			if (offer == 'hosting') {

				if (custom === undefined || custom == 0) {
					NotificationService.error(req, req.__('Vous devez choisir un sous-domaine !'))
					return res.redirect('/purchase/hosting')
				}

				Hosting.count({host: custom, hostType: 'SUBDOMAIN'}).exec(function (err, count) {

					if (err) {
						sails.log.error(err)
						return res.serverError('An error occured on hosting check')
					}

					if (count > 0) {
						NotificationService.error(req, req.__('Vous devez choisir un sous-domaine disponible !'))
						return res.redirect('/purchase/hosting')
					}

					// save purchase
					PurchaseService.buy({
						userId: req.session.userId,
						offerType: offer.toUpperCase(),
						host: custom,
						paymentType: 'FREE'
					}, function (success, purchaseId, itemId) {

						if (success) {

							// set voucher at used
							Voucher.update({id: voucher.id}, {usedBy: req.session.userId, usedAt: (new Date()), usedLocation: req.ip, itemType: offer.toUpperCase(), itemId: itemId}).exec(function (err, voucher) {

								if (err) {
									sails.log.error(err)
									return res.serverError('An error occured on voucher update')
								}

								// Redirect on profile with notification
								NotificationService.success(req, req.__('Vous avez bien payé et reçu votre produit !'))
								res.redirect('/user/profile')

							})

						}
						else {
							return res.serverError('An error occured on purchase')
						}

					})
				})
			}
			else {
				// save purchase
				PurchaseService.buy({
					userId: req.session.userId,
					offerType: offer.toUpperCase(),
					host: custom,
					paymentType: 'FREE'
				}, function (success, purchaseId, itemId) {

					if (success) {
						// set voucher at used
						Voucher.update({id: voucher.id}, {usedBy: req.session.userId, usedAt: (new Date()), usedLocation: req.ip, itemType: offer.toUpperCase(), itemId: itemId}).exec(function (err, voucher) {

							if (err) {
								sails.log.error(err)
								return res.serverError('An error occured on voucher update')
							}

							// Redirect on profile with notification
							NotificationService.success(req, req.__('Vous avez bien payé et reçu votre produit !'))
							res.redirect('/user/profile')

						})
					}
					else {
						return res.serverError('An error occured on purchase')
					}

				})
			}

		})

	}

};
