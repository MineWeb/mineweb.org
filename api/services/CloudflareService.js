module.exports = {
  getIP: function (req) {
    if (!req)
      return '127.0.0.1'
    var ip
    ip = req.headers['cf-connecting-ip'] || req.ip
    return ip
  }
}
