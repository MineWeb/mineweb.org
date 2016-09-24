/**
 * Admin
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any logged user with permission to access to admin panel
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {

  if (req.session.userId === undefined || res.locals.user.role === 'USER') {
    // nope, not logged or simple user
    return res.forbidden('Not authorized')
  }

  if (PermissionsService.can({controller: req.options.controller, action: req.options.action}, res.locals.user))
    return next()

  return res.forbidden('Not authorized to access admin panel')
};
