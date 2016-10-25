module.exports = function (req, res, next) {
  req.ip = req.headers['cf-connecting-ip'] || req.ip
  next()
}
