module.exports = {
  success: function(req, message) {
    req.session.notifications['success'].push(message);
  },
  warning: function(req, message) {
    req.session.notifications['warning'].push(message);
  },
  error: function(req, message) {
    req.session.notifications['error'].push(message);
  },
  info: function(req, message) {
    req.session.notifications['info'].push(message);
  }
}
