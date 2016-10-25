module.exports = function (req, res, next) {
  req.ip = req.headers['HTTP_CF_CONNECTING_IP'] || req.ip
  next()
}
