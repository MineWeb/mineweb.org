/**
 * developer
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any developer user
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {

  if (req.session.userId === undefined || res.locals.user.developer !== 'CONFIRMED') {

    // nope, not logged or dev
    return res.forbidden('Not developer')

  }

  return next()

};
