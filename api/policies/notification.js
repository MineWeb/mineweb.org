module.exports = function(req, res, next) {

  res.locals.notifications = { success: [], error: [], warning: [], info: [] };

  if(!req.session.notifications) {
    req.session.notifications = { success: [], error: [], warning: [], info: [] };
    return next();
  }
  res.locals.notifications = _.clone(req.session.notifications);

  // Clear flash
  req.session.notifications = { success: [], error: [], warning: [], info: [] };
  return next();
};
