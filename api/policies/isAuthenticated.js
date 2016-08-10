/**
 * isAuthenticated
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function(req, res, next) {

  // On check si on a l'userId
  if (req.session.userId === undefined) {

    // On regarde si y'a un cookie pour remember
    if (req.cookies.remember_me === undefined) {
      req.session.authenticated = false
      return next()
    }

    // On tente de le connecter
    User.findOne({username: req.cookies.remember_me.username, password: req.cookies.remember_me.password}).exec(function (err, user) {

      if (err) {
        sails.log.error(err)
        return response.serverError()
      }

      // On trouve pas d'user
      if (user === undefined) {
        req.session.authenticated = false
        return next()
      }

      // On le connecte
      req.session.userId = user.id

      // On le met en tant que connecté
      req.session.authenticated = true;
      res.locals.user = user

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
