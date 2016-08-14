/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function(req, res, next) {

  // User is allowed, proceed to the next policy,
  // or if this is the last policy, the controller
  if (req.session.authenticated) {
    return next();
  }

  // User is not allowed

  // Si on veux du JSON (ajax)
  if (req.wantsJSON) {
    res.status(403);
    return res.jsonx({
      status: false,
      msg: req.__("Vous n'êtes pas autorisé à accèder a cette partie du site sans être connecté.")
    });
  }

  // On le redirige vers la page de connexion, en donnant en paramètre la page d'où il vient
  return res.redirect('/login?from=' + req.path);
};
