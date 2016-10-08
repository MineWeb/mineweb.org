/**
 * PurchaseControllerController
 *
 * @description :: Server-side logic for managing Purchasecontrollers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var request = require('request')
var paypalIPN = require('paypal-ipn')
var querystring = require('querystring')

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
		Hosting.findOne({hostType: 'SUBDOMAIN'}).populate('license', {host: subdomain}).exec(function (err, count) {

			if (err) {
				sails.log.error(err)
				return res.serverError('An error occured on dedipass api')
			}
			console.log(subdomain)
			console.log(count)
			if (count !== undefined && count.license !== undefined) {
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
			if (req.body.offer != 'license' && req.body.offer != 'hosting' && req.body.offer != 'plugin' && req.body.offer != 'theme')
				return res.notFound('Unknown offer')

		// Get params
			var voucherCode = req.body.voucher
			var offer = req.body.offer

		// get price
			PurchaseService.getPriceOfOffer(offer, req.body.custom, function (success, price) {

				if (!success)
					return res.serverError()

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
						if (offer == "license") {
							var item_name = req.__("Achat d'une licence MineWeb")
						}
						else if (offer == "hosting") {
							var item_name = req.__("Location d'une licence et d'un hébergement MineWeb pour 1 mois")
						}
						else if (offer == "plugin") {
							var item_name = req.__("Achat d'un plugin MineWeb")
						}
						else if (offer == "theme") {
							var item_name = req.__("Achat d'un theme MineWeb")
						}
						var data = { // Form PayPal values
							tax: fees,
							return_url: RouteService.getBaseUrl() + '/buy/paypal/success',
							cancel_return: RouteService.getBaseUrl() + '/purchase/' + offer,
							notify_url: RouteService.getBaseUrl() + '/api/paypal-ipn',
							business: sails.config.paypal.merchantEmail,
							item_name: item_name,
							custom: querystring.stringify({
								offer: offer,
								voucher: voucherCode,
								userId: req.session.userId,
								other: req.body.custom
							}),
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

								// If not a renew
								if(req.body.custom.split('renew-').length !== 2) {

									Hosting.findOne({hostType: 'SUBDOMAIN'}).populate('license', {host: subdomain}).exec(function (err, count) {

										if (err) {
											sails.log.error(err)
											return res.serverError('An error occured on dedipass api')
										}

										if (count !== undefined && count.license !== undefined) {
											NotificationService.error(req, req.__('Vous devez choisir un sous-domaine disponible !'))
											return res.redirect('/purchase/hosting')
										}

										return res.view('./buy/paypal', data)

									})

								}
								else { // Renew
									// Search hosting
									Hosting.count({id: req.body.custom.split('renew-')[1]}).exec(function (err, count) {

										if (err) {
											sails.log.error(err)
											return res.serverError('An error occured on dedipass api')
										}

										if (count === 0) {
											NotificationService.error(req, req.__('Vous ne pouvez pas renouveler une licence hébergée inexistant !'))
											return res.redirect('/purchase/hosting')
										}

										return res.view('./buy/paypal', data)

									})
								}

							}
							else { // Not hosting
								return res.view('./buy/paypal', data)
							}

					})

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

				// If not a renew
				if(req.body.custom.split('renew-').length !== 2) {
					Hosting.findOne({hostType: 'SUBDOMAIN'}).populate('license', {host: subdomain}).exec(function (err, count) {

						if (err) {
							sails.log.error(err)
							return res.serverError('An error occured on dedipass api')
						}

						if (count !== undefined && count.license !== undefined) {
							NotificationService.error(req, req.__('Vous devez choisir un sous-domaine disponible !'))
							return res.redirect('/purchase/hosting')
						}

						// Handle dedipass pubic key
							var dedipassPublicKey = sails.config.dedipass.publicKeys.hosting

						// Render view
						res.view('./buy/dedipass', {
							title: req.__("Payer avec Dédipass"),
							dedipassPublicKey: dedipassPublicKey,
							custom: req.body.custom
						})

					})
				}
				else { // Renew
					// Search hosting
					Hosting.count({id: req.body.custom.split('renew-')[1]}).exec(function (err, count) {

						if (err) {
							sails.log.error(err)
							return res.serverError('An error occured on dedipass api')
						}

						if (count === 0) {
							NotificationService.error(req, req.__('Vous ne pouvez pas renouveler une licence hébergée inexistant !'))
							return res.redirect('/purchase/hosting')
						}

						// Handle dedipass pubic key
							var dedipassPublicKey = sails.config.dedipass.publicKeys.hosting

						// Render view
							res.view('./buy/dedipass', {
								title: req.__("Payer avec Dédipass"),
								dedipassPublicKey: dedipassPublicKey,
								custom: req.body.custom
							})

					})
				}
			}
			else { // Not hosting, licence

				// Handle dedipass pubic key
					var dedipassPublicKey = sails.config.dedipass.publicKeys.license

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

		if (sails.config.paypal.sandbox)
			req.body.test_ipn = true
		else
			req.body.test_ipn = false

		paypalIPN.verify(req.body, {'allow_sandbox': sails.config.paypal.sandbox}, function (err, msg) {

		  if (err) {
		    sails.log.error(err)
				return res.serverError()
		  }
			else {

				// Set vars
				var params = req.body

				var data = querystring.parse(params.custom)

				if (data === undefined || data.offer === undefined)
					return res.serverError('Undefined offer')

				var offer = data.offer

		    if (params.payment_status == 'Completed') { // Good behavior, payment accepted

					// Check currency
					if (params.mc_currency !== "EUR") {
						return res.serverError('Bad currency')
					}

					// Check if not already saved as completed (or already handled) for this txn_id
					PayPalHistory.count({paymentId: params.txn_id, state: ['COMPLETED', 'FAILED', 'REFUNDED', 'REVERSED']}).exec(function (err, count) {

						if (err) {
							sails.log.error(err)
							return res.serverError()
						}

						if (count > 0)
							return res.serverError('Payment already handled')

						// save purchase
						PurchaseService.req = req
						PurchaseService.buy({
							userId: data.userId,
							offerType: offer.toUpperCase(),
							offerId: (data.other === undefined || data.other == 'undefined' || (offer != "plugin" && offer != "theme")) ? undefined : data.other,
							host: (data.other === undefined || data.other == 'undefined' || offer != "hosting" || data.other.split('renew-').length === 2) ? null : data.other,
							hostRenew: (data.other.split('renew-').length === 2 && offer == "hosting") ? data.other.split('renew-')[1] : false,
							paymentType: 'PAYPAL',
							voucher: data.voucher,
							amount: params.mc_gross,
							receiver: params.receiver_email
						}, function (success, purchaseId) {

							if (success) {

								// Check if the payment isn't save as pending transaction
								PayPalHistory.findOne({paymentId: params.txn_id, state: 'PENDING'}).exec(function (err, history) {

									if (err) {
										sails.log.error(err)
										return res.serverError()
									}

									if (history === undefined) { // no payment pending

										PayPalHistory.create({
											user: data.userId,
											paymentId: params.txn_id,
											paymentAmount: params.mc_gross,
											taxAmount: params.mc_fee,
											buyerEmail: params.payer_email,
											paymentDate: (new Date(params.payment_date)),
											state: 'COMPLETED'
										}).exec(function (err, history) {

											if (err) {
												sails.log.error(err)
												return res.serverError()
											}

											// set payment id of purchase
											Purchase.update({id: purchaseId}, {paymentId: history.id}).exec(function (err, purchase) {

												if (err) {
													sails.log.error(err)
													return res.serverError()
												}

												// update paypal history with purchase id
												PayPalHistory.update({id: history.id}, {purchase: purchaseId}).exec(function (err, history) {

													if (err) {
														sails.log.error(err)
														return res.serverError()
													}

													// Send 200 response for PayPal
													return res.send()

												})

											})

										})

									}
									else { // payment was pending

										PayPalHistory.update({id: history.id}, {
											state: 'COMPLETED'
										}).exec(function (err, history) {

											if (err) {
												sails.log.error(err)
												return res.serverError()
											}

											// set payment id of purchase
											Purchase.update({id: purchaseId}, {paymentId: history.id}).exec(function (err, purchase) {

												if (err) {
													sails.log.error(err)
													return res.serverError()
												}

												// update paypal history with purchase id
												PayPalHistory.update({id: history.id}, {purchase: purchase.id}).exec(function (err, history) {

													if (err) {
														sails.log.error(err)
														return res.serverError()
													}

													// Send 200 response for PayPal
													return res.send()

												})


											})

										})

									}



								})

							}
							else {
								return res.serverError('An error occured on purchase')
							}

						})

					})

		    }
				else if (params.payment_status == 'Pending') { // Waiting banks

					if (params.receiver_email !== sails.config.paypal.merchantEmail)
						return res.serverError('[PAYPAL] Bad receiver')

					// Create PayPalHistory line
					PayPalHistory.create({
						user: data.userId,
						paymentId: params.txn_id,
						paymentAmount: params.mc_gross,
						taxAmount: params.mc_fee,
						buyerEmail: params.payer_email,
						paymentDate: (new Date(params.payment_date)),
						state: 'PENDING'
					}).exec(function (err, history) {

						if (err) {
					    sails.log.error(err)
							return res.serverError()
					  }

						return res.send()

					})
				}
				else if (params.payment_status == 'Failed') { // Bank cancel payment
					// Just update payment status
					PayPalHistory.update({paymentId: params.txn_id}, {
						state: 'FAILED'
					}).exec(function (err, history) {

						if (err) {
					    sails.log.error(err)
							return res.serverError()
					  }

						return res.send()

					})
				}
				else if (params.payment_status == 'Refunded') { // Loose case / Refund requested by user
					// Update payment status & reason
					PayPalHistory.update({paymentId: params.parent_txn_id}, {
						state: 'REFUNDED',
						refundDate: (new Date())
					}).exec(function (err, history) {

						if (err) {
					    sails.log.error(err)
							return res.serverError()
					  }

						// get purchase data
						Purchase.findOne({id: history[0].purchase}).exec(function (err, purchase) {

							// Update suspended reason if license/hosting
							if (purchase.type == 'LICENSE' || purchase.type == 'HOSTING') {

								License.update({hosting: purchase.itemId}, {suspended: req.__('Paiement PayPal remboursé')}).exec(function (err, item) {
									return res.send()
								})

							}
							else {
								return res.send()
							}

						})

					})
				}
				else if (params.payment_status == 'Reversed') { // Open case (Loose temporaly funds)

					if (params.reason_code == 'buyer-complaint')
						var reason = 'BUYER_COMPLAINT'
					else if (params.reason_code == 'unauthorized_claim' || params.reason_code == 'unauthorized_spoof')
						var reason = 'UNAUTHORIZED'
					else
						var reason = 'OTHER'

					// Update payment status & reason
					PayPalHistory.update({paymentId: params.parent_txn_id}, {
						state: 'REVERSED',
						caseDate: (new Date()),
						reversedReason: reason
					}).exec(function (err, history) {

						if (err) {
							sails.log.error(err)
							return res.serverError()
						}

						// get purchase data
						Purchase.findOne({id: history[0].purchase}).exec(function (err, purchase) {

							if (err) {
								sails.log.error(err)
								return res.serverError()
							}

							// Update suspended reason if license/hosting
							if (purchase.type == 'LICENSE' || purchase.type == 'HOSTING') {

								License.update({hosting: purchase.itemId}, {suspended: req.__('Litige PayPal')}).exec(function (err, item) {
									return res.send()
								})

							}
							else {
								return res.send()
							}

						})

					})
				}
				else if (params.payment_status == 'Canceled_Reversal') { // Win case, like accepted payment
					// Update payment status
					PayPalHistory.update({paymentId: params.parent_txn_id}, {
						state: 'COMPLETED'
					}).exec(function (err, history) {

						if (err) {
							sails.log.error(err)
							return res.serverError()
						}

						// get purchase data
						Purchase.findOne({id: history[0].purchase}).exec(function (err, purchase) {

							if (purchase === undefined)
								res.send()

							// Update suspended reason if license/hosting
							if (purchase.type == 'LICENSE' || purchase.type == 'HOSTING') {

								License.update({hosting: purchase.itemId}, {suspended: null}).exec(function (err, item) {
									return res.send()
								})

							}
							else {
								return res.send()
							}

						})

					})
				}
				else {
					// Not supported
					return res.send()
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
					host: (req.body.custom.split('renew-').length !== 2 && offer == "hosting") ? req.body.custom : undefined,
					paymentType: 'DEDIPASS',
					hostRenew: (req.body.custom.split('renew-').length === 2 && offer == "hosting") ? req.body.custom.split('renew-')[1] : false
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

				Hosting.findOne({hostType: 'SUBDOMAIN'}).populate('license', {host: custom}).exec(function (err, count) {

					if (err) {
						sails.log.error(err)
						return res.serverError('An error occured on hosting check')
					}

					if (count !== undefined && count.license !== undefined) {
						NotificationService.error(req, req.__('Vous devez choisir un sous-domaine disponible !'))
						return res.redirect('/purchase/hosting')
					}

					// save purchase
					PurchaseService.buy({
						userId: req.session.userId,
						offerType: 'HOSTING',
						host: custom,
						paymentType: 'FREE'
					}, function (success, purchaseId, itemId) {

						if (success) {

							saveAndRender('HOSTING', itemId)

						}
						else {
							return res.serverError('An error occured on purchase')
						}

					})
				})
			}
			else if (offer == 'license') {
				// save purchase
				PurchaseService.buy({
					userId: req.session.userId,
					offerType: 'LICENSE',
					host: custom,
					paymentType: 'FREE'
				}, function (success, purchaseId, itemId) {

					if (success) {

						saveAndRender('LICENSE', itemId)

					}
					else {
						return res.serverError('An error occured on purchase')
					}

				})
			}
			else {
				// save purchase
				PurchaseService.buy({
					userId: req.session.userId,
					offerType: offer.toUpperCase(),
					offerId: custom,
					paymentType: 'FREE'
				}, function (success, purchaseId, itemId) {

					if (success) {

						saveAndRender(offer.toUpperCase(), itemId)

					}
					else {
						return res.serverError('An error occured on purchase')
					}

				})
			}

			function saveAndRender(itemType, itemId) {
				// set voucher at used
				Voucher.update({id: voucher.id}, {usedBy: req.session.userId, usedAt: (new Date()), usedLocation: req.ip, itemType: itemType, itemId: itemId}).exec(function (err, voucher) {

					if (err) {
						sails.log.error(err)
						return res.serverError('An error occured on voucher update')
					}

					// Redirect on profile with notification
					NotificationService.success(req, req.__('Vous avez bien payé et reçu votre produit !'))
					res.redirect('/user/profile')

				})
			}

		})

	}

};
