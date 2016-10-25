/**
 * ApiController
 *
 * @description :: Server-side logic for managing api call
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var http = require('http')
var httpProxy = require('http-proxy')
var keepAliveAgent = new http.Agent({keepAlive: true})
var proxy = httpProxy.createProxyServer({target: sails.config.api.endpointWithoutVersion, agent: keepAliveAgent})

module.exports = {

  forward: function (req, res) {
    return proxy.web(req, res, {
      target: sails.config.api.endpointWithoutVersion
    })
  }

}
