/**
 * isAuthenticated
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
var async	= require('async')

module.exports = function(req, res, next) {

  // On check si on a l'userId
  if (req.session.userId === undefined) {

    // On regarde si y'a un cookie pour remember
    if (req.signedCookies.remember_me === undefined) {
      req.session.authenticated = false
      return next()
    }

    async.parallel([

      // On cherche le token
      function (callback) {

        RememberTokens.count({user: req.signedCookies.remember_me.userId, token: req.signedCookies.remember_me.token}).exec(function (err, count) {
          if (err)
            callback(err, null)
          else
            callback(null, (count > 0))
        })

      },

      // On cherche l'user
      function (callback) {

        User.findOne({id:req.signedCookies.remember_me.userId}).exec(function (err, user) {
          if (err)
            callback(err, null)
          else
            callback(null, user)
        })

      }

    ], function (err, results) {

      if (err) {
        sails.log.error(err)
        return response.serverError()
      }

      var token = results[0]
      var user = results[1]

      // On trouve pas de token
      if (!token) {
        req.session.authenticated = false
        return next()
      }

      // On trouve pas l'user
      if (user === undefined) {
        req.session.authenticated = false
        return next()
      }

      // On le connecte
      req.session.userId = user.id

      // On le met en tant que connecté
      req.session.authenticated = true;
      res.locals.user = User.addMd5Email(user)

      // On passe aux étapes suivantes
      return next()

    })

  } else {

    // On vérifie que l'id est valide & on récupère les données
    User.findOne({id: req.session.userId}).exec(function (err, user) {

      if (err) {
        sails.log.error(err)
        return next()
      }

      if (user === undefined) {
        return next()
      }

      req.session.authenticated = true;
      res.locals.user = user

      next()

    })

  }

};
