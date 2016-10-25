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

  '*': ['isAuthenticated', 'flash', 'notification', 'cloudflare'],
  // '*': true,

  /* **************************************************************************
  *                                                                          *
  * Here's an example of mapping some policies to run before a controller    *
  * and its actions                                                          *
  *                                                                          *
  ***************************************************************************/

  UserController: {
    '*': ['isAuthenticated', 'flash', 'notification', 'cloudflare'],
    profile: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare'],
    editEmail: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare'],
    editPassword: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare'],
    disableTwoFactorAuthentification: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare'],
    enableTwoFactorAuthentificationPage: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare'],
    enableTwoFactorAuthentification: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare']
  },

  StaticController: {
    '*': ['isAuthenticated', 'flash', 'notification', 'cloudflare'],
    buyLicense: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare'],
    rentHosting: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare']
  },

  PurchaseController: {
    '*': ['isAuthenticated', 'flash', 'notification', 'cloudflare'],
    paypal: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare'],
    dedipass: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare'],
    dedipassIPN: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare'],
    getFree: ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare']
  },

  TicketController: {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare']
  },

  HostingController: {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare']
  },

  LicenseController: {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare']
  },

  DeveloperController: {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'developer', 'cloudflare'],
    'index': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare'],
    'candidate': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'cloudflare']
  },

  'Admin/DashboardController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin', 'cloudflare']
  },

  'Admin/TicketController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin', 'cloudflare']
  },

  'Admin/LicenseController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin', 'cloudflare']
  },

  'Admin/UserController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin', 'cloudflare']
  },

  'Admin/UpdateController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin', 'cloudflare']
  },

  'Admin/StatisticController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin', 'cloudflare']
  },

  'Admin/PaymentController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin', 'cloudflare']
  },

  'Admin/ApiController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin', 'cloudflare']
  },

  'Admin/DeveloperController': {
    '*': ['isAuthenticated', 'sessionAuth', 'flash', 'notification', 'admin', 'cloudflare']
  }

}
