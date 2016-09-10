/**
 * logger
 *
 * @module      :: Policy
 * @description :: Simple policy to log any action of any authenticated user
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function(req, res, next) {

  // User is authenticated
  if (req.session.authenticated) {

    Log.create({
      action: 'LOG_ACTION',
      ip: req.ip,
      status: true,
      type: 'USER',
      data: {
        user: req.session.userId,
        request: {
          method: req.method,
          url: req.url,
          controller: req.options.controller,
          action: req.options.action,
          query: req.query,
          body: req.body
        }
      }
    }).exec(function (err, log) {
      if (err)
        sails.log.error(err)
    })

    return next()
  }
  else {
    return next()
  }

};
