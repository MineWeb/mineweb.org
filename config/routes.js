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

/* **************************************************************************
*                                                                          *
*                            PUBLIC                                        *
*                                                                          *
************************************************************************** */

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

  '/legal/conditions': { view: 'legal/conditions', locals: {title: 'CGV'} },
  '/legal/cgu': { view: 'legal/cgu', locals: {title: 'CGU'} },

  '/api/v1/plugin_version': 'StaticController.plugin_version',

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

  'get /sign': 'UserController.loginPage',
  'get /signup': 'UserController.loginPage',
  'get /signin': 'UserController.loginPage',
  'get /register': 'UserController.loginPage',
  'get /login': 'UserController.loginPage',

  'post /user/login': 'UserController.login',
  'post /user/signup': 'UserController.signup',
  'get /user/confirm-email/:token': 'UserController.confirmEmail',
  'get /user/reset-password/:token': 'UserController.resetPasswordPage',
  'post /user/reset-password': 'UserController.resetPassword',
  'get /user/lost-password': 'UserController.lostPasswordPage',
  'post /user/lost-password': 'UserController.lostPassword',
  'get /user/profile': 'UserController.profile',
  'get /user/logout': 'UserController.logout',

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
  '/wiki/*': 'https://docs.mineweb.org',
  '/wiki': 'https://docs.mineweb.org',
  '/documentation': 'https://docs.mineweb.org',

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

  '/license/download/:id': 'LicenseController.download',

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

  'get /developer/update/plugin/:id': 'DeveloperController.updatePluginPage',
  'post /developer/update/plugin/:id': 'DeveloperController.updatePlugin',

  '/developer/delete/plugin/:id': 'DeveloperController.deletePlugin',

  'get /developer/add/theme': 'DeveloperController.addThemePage',
  'post /developer/add/theme': 'DeveloperController.editTheme',

  'get /developer/edit/theme/:id': 'DeveloperController.editThemePage',
  'post /developer/edit/theme/:id': 'DeveloperController.editTheme',

  'get /developer/update/theme/:id': 'DeveloperController.updateThemePage',
  'post /developer/update/theme/:id': 'DeveloperController.updateTheme',

  '/developer/delete/theme/:id': 'DeveloperController.deleteTheme',

  /*
    REVERSE PROXY FOR API
   */
  '/api/**': 'ApiController.forward',

  /* **************************************************************************
  *                                                                          *
  *                           ADMIN ROUTES                                   *
  *                                                                          *
  ************************************************************************** */

  '/admin': 'Admin/DashboardController.admin',

  '/admin/dashboard': 'Admin/DashboardController.index',
  'get /admin/settings': 'Admin/DashboardController.settings',
  'post /admin/settings': 'Admin/DashboardController.updateSettings',

  '/admin/support': 'Admin/TicketController.index',
  '/admin/support/:id': 'Admin/TicketController.view',
  '/admin/support/close/:id': 'Admin/TicketController.close',
  '/admin/support/take/:id': 'Admin/TicketController.take',
  '/admin/support/edit-category/:id': 'Admin/TicketController.editCategory',
  '/admin/support/edit-state/:id': 'Admin/TicketController.editState',

  'post /admin/support/reply/:id': 'Admin/TicketController.reply',

  '/admin/license/view/:id': 'Admin/LicenseController.view',
  '/admin/hosting/view/:id': 'Admin/LicenseController.switchToLicenseId',
  '/admin/license/suspend/:id/:reason': 'Admin/LicenseController.suspend',
  '/admin/license/unsuspend/:id': 'Admin/LicenseController.unsuspend',
  '/admin/license/get-debug/:id': 'Admin/LicenseController.getDebug',

  'get /admin/license/find': 'Admin/LicenseController.findPage',
  'post /admin/license/find': 'Admin/LicenseController.find',

  'get /admin/user/find': 'Admin/UserController.findPage',
  'post /admin/user/find': 'Admin/UserController.find',
  '/admin/user/view/:id': 'Admin/UserController.view',

  '/admin/update': 'Admin/UpdateController.index',
  'post /admin/update/add': 'Admin/UpdateController.add',
  'post /admin/update/edit/:id': 'Admin/UpdateController.edit',

  '/admin/stats': 'Admin/StatisticController.index',

  '/admin/payments/list': 'Admin/PaymentController.view',
  '/admin/payments/get/paypal': 'Admin/PaymentController.getPayPalPayements',
  '/admin/payments/get/dedipass': 'Admin/PaymentController.getDedipassPayements',

  '/admin/api/logs': 'Admin/ApiController.log',
  '/admin/api/get/logs': 'Admin/ApiController.getLogs',
  '/admin/api/faq': 'Admin/ApiController.faq',
  'post /admin/api/faq/add': 'Admin/ApiController.addQuestion',
  '/admin/api/faq/remove/:id': 'Admin/ApiController.removeQuestion',
  'post /admin/api/faq/edit/:id': 'Admin/ApiController.editQuestion',

  '/admin/developer/candidate': 'Admin/DeveloperController.viewCandidates',
  '/admin/developer/candidate/view/:id': 'Admin/DeveloperController.viewCandidate',
  '/admin/developer/candidate/accept/:id': 'Admin/DeveloperController.acceptCandidate',
  '/admin/developer/candidate/refuse/:id': 'Admin/DeveloperController.refuseCandidate',
  '/admin/developer/view/submitted': 'Admin/DeveloperController.viewPluginsAndThemesSubmitted',
  '/admin/developer/view/online': 'Admin/DeveloperController.viewPluginsAndThemesOnline',
  '/admin/developer/submitted/plugin/view/:id': 'Admin/DeveloperController.viewPluginSubmitted',
  '/admin/developer/submitted/theme/view/:id': 'Admin/DeveloperController.viewThemeSubmitted',
  'post /admin/developer/submitted/plugin/accept/:id': 'Admin/DeveloperController.acceptPluginSubmitted',
  'post /admin/developer/submitted/plugin/refuse/:id': 'Admin/DeveloperController.refusePluginSubmitted',
  'post /admin/developer/submitted/theme/accept/:id': 'Admin/DeveloperController.acceptThemeSubmitted',
  'post /admin/developer/submitted/theme/refuse/:id': 'Admin/DeveloperController.refuseThemeSubmitted',
  '/admin/developer/submitted/plugin/download/:id': 'Admin/DeveloperController.downloadPluginSubmitted',
  '/admin/developer/submitted/theme/download/:id': 'Admin/DeveloperController.downloadThemeSubmitted'

}
