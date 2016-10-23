/**
 * ApiController
 *
 * @description :: Server-side logic for managing api call
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var httpProxy = require('http-proxy');
var proxy     = httpProxy.createProxyServer();

module.exports = {

  forward: function (req, res) {
    return proxy.web(req, res, {
      target: sails.config.api.endpointWithoutVersion
    });
  },

}
