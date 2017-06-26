module.exports = {
  getIP: function (req) {
    if (sails.config.environment === 'development')
      return '89.84.110.231'
    if (!req)
      return '127.0.0.1'
    var ip
    ip = req.headers['cf-connecting-ip'] || req.ip
    return ip
  }
}
