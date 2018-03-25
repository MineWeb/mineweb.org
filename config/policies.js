/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */

module.exports.policies = {

  /* **************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  '*': ['isAuthenticated', 'flash', 'notification'],
  // '*': true,

  /* **************************************************************************
  *                                                                          *
  * Here's an example of mapping some policies to run before a controller    *
  * and its actions                                                          *
  *                                                                          *
  ***************************************************************************/

  UserController: {
    '*': ['isAuthenticated', 'flash', 'notification'],
    profile: ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    editEmail: ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    editPassword: ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    disableTwoFactorAuthentification: ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    enableTwoFactorAuthentificationPage: ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    enableTwoFactorAuthentification: ['isAuthenticated', 'sessionAuth', 'flash', 'notification']
  },

  StaticController: {
    '*': ['isAuthenticated', 'flash', 'notification'],
    buyLicense: ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    rentHosting: ['isAuthenticated', 'sessionAuth', 'flash', 'notification']
  },

  PurchaseController: {
    '*': ['isAuthenticated', 'flash', 'notification'],
    paypal: ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    dedipass: ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    dedipassIPN: ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    getFree: ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    getFreeLicense: ['isAuthenticated', 'sessionAuth', 'flash', 'notification']
  },

  TicketController: {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification']
  },

  HostingController: {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification']
  },

  LicenseController: {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification']
  },

  DeveloperController: {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'developer'],
    'index': ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    'candidate': ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    'submitCustomExtensionPage': ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    'submitCustomExtension': ['isAuthenticated', 'sessionAuth', 'flash', 'notification'],
    'downloadCustomSecure': ['isAuthenticated', 'sessionAuth', 'flash', 'notification']
  },

  'Admin/DashboardController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin']
  },

  'Admin/TicketController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin']
  },

  'Admin/LicenseController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin']
  },

  'Admin/UserController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin']
  },

  'Admin/UpdateController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin']
  },

  'Admin/StatisticController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin']
  },

  'Admin/PaymentController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin']
  },

  'Admin/ApiController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin']
  },

  'Admin/DeveloperController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin']
  }

}
