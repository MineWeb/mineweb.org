/**
 * ApiController
 *
 * @description :: Server-side logic for managing api call
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var http = require('http')

module.exports = {

  forward: function (req, res) {
    var proxy_req = http.request({
      hostname: '51.255.36.8',
      port: 80,
      method: req.method,
      path: req.url,
      headers: req.headers
    }, function (proxy_res) {
      proxy_res.setEncoding('utf8')
      proxy_res.on('data', function (chunk) {
        res.write(chunk)
      })
      proxy_res.on('end', function () {
        res.end()
      })
      res.writeHead(proxy_res.statusCode, proxy_res.headers)
    })

    proxy_req.on('error', function (e) {
      sails.log.error(e)
      return res.serverError()
    })

    // write data to request body
    if (req.rawBody !== undefined)
      proxy_req.write(req.rawBody)
    proxy_req.end()
  }

}
