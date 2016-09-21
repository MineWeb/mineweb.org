/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  /*
    STATIC/BASIC
  */


    '/': 'StaticController.home',
    '/changelog': 'StaticController.changelog',
    '/versions': 'StaticController.changelog',
    '/download': 'StaticController.downloadPage',

    '/buy-license': 'StaticController.buyLicense',
    '/purchase/license': 'StaticController.buyLicense',
    '/rent-hosting': 'StaticController.rentHosting',
    '/purchase/hosting': 'StaticController.rentHosting',
    '/hosting/renew/:id': 'StaticController.rentHosting',

  /*
    PURCHASE
  */

    '/purchase/:offer/free/:voucherCode/*': 'PurchaseController.getFree',

    '/purchase/checkVoucher/:voucherCode/:price': 'PurchaseController.checkVoucher',
    '/purchase/checkHostingSubdomainAvailability/:subdomain': 'PurchaseController.checkHostingSubdomainAvailability',

    'post /buy/dedipass': 'PurchaseController.dedipass',
    'post /buy/paypal': 'PurchaseController.paypal',

    '/buy/paypal/success': 'PurchaseController.paypalSuccessPage',

    'post /api/dedipass-ipn': 'PurchaseController.dedipassIPN',
    'post /api/paypal-ipn': 'PurchaseController.paypalIPN',

  /*
    USER
  */

    '/sign': 'UserController.loginPage',
    '/signup': 'UserController.loginPage',
    '/signin': 'UserController.loginPage',
    '/register': 'UserController.loginPage',
    '/login': 'UserController.loginPage',

    'post /user/login': 'UserController.login',
    'get /user/confirm-email/:token': 'UserController.confirmEmail',
    'get /user/reset-password/:token': 'UserController.resetPasswordPage',
    'post /user/reset-password': 'UserController.resetPassword',
    'get /user/lost-password': 'UserController.lostPasswordPage',
    'post /user/lost-password': 'UserController.lostPassword',
    'get /user/profile': 'UserController.profile',

    'post /user/edit-email': 'UserController.editEmail',
    'post /user/edit-password': 'UserController.editPassword',

    'get /user/two-factor-auth/disable': 'UserController.disableTwoFactorAuthentification',
    'get /user/two-factor-auth/enable': 'UserController.enableTwoFactorAuthentificationPage',
    'post /user/two-factor-auth/enable': 'UserController.enableTwoFactorAuthentification',
    'get /user/login/twoFactorAuth': 'UserController.loginTwoFactorAuthVerificationPage',
    'post /user/login/twoFactorAuth': 'UserController.loginTwoFactorAuthVerification',

		 /*
    	MARKETPLACE
  	*/
		'get /market': 'MarketController.index',
    'get /market/theme/:slug': 'MarketController.theme',
    'get /market/plugin/:slug': 'MarketController.plugin',


    /*
      SUPPORT
    */
    '/support': 'TicketController.index',
    '/support/open': 'TicketController.newPage',
    'post /support/new': 'TicketController.new',
    '/support/view/:id': 'TicketController.view',
    'post /support/reply/:id': 'TicketController.reply',
    '/support/close/:id': 'TicketController.close',
    '/support/reopen/:id': 'TicketController.reopen',

    /*
      DOCS
    */
    '/wiki/*': 'http://docs.mineweb.org',
    '/wiki': 'http://docs.mineweb.org',
    '/documentation': 'http://docs.mineweb.org',

    /*
      HOSTING
    */
    'post /hosting/edit-host': 'HostingController.editHost',

    /*
      LICENSE
    */
    'post /license/edit-host': 'LicenseController.editHost',
    '/license/enable/:id': 'LicenseController.enable',
    '/license/disable/:id': 'LicenseController.disable',

    /*
      DEVELOPER
    */
    '/developer': 'DeveloperController.index',
    'post /developer/candidate': 'DeveloperController.candidate',
    'post /developer/edit/paypal': 'DeveloperController.editPayPalData',

    'get /developer/add/plugin': 'DeveloperController.addPluginPage',
    'post /developer/add/plugin': 'DeveloperController.editPlugin',

    'get /developer/edit/plugin/:id': 'DeveloperController.editPluginPage',
    'post /developer/edit/plugin/:id': 'DeveloperController.editPlugin',

    'get /developer/version/plugin/:id': 'DeveloperController.updatePluginPage',
    'post /developer/version/plugin/:id': 'DeveloperController.updatePlugin',

    '/developer/delete/plugin/:id': 'DeveloperController.deletePlugin',

    'get /developer/add/theme': 'DeveloperController.addThemePage',
    'post /developer/add/theme': 'DeveloperController.editTheme',

    'get /developer/edit/theme/:id': 'DeveloperController.editThemePage',
    'post /developer/edit/theme/:id': 'DeveloperController.editTheme',

    'get /developer/version/theme/:id': 'DeveloperController.updateThemePage',
    'post /developer/version/theme/:id': 'DeveloperController.updateTheme',

    '/developer/delete/theme/:id': 'DeveloperController.deleteTheme'

  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

};
