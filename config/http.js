/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * Only applies to HTTP requests (not WebSockets)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.http.html
 */

var pmx = require('pmx');
var expressLog = require('express-winston');
var ESTransport = require('winston-elasticsearch');
var winston = require('winston')
var device = require('express-device')

var TRANSPORTS = [];
if (process.env.NODE_ENV !== 'production') {
  TRANSPORTS.push(new winston.transports.Console({ json: false, colorize: true }))
}

module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Express middleware to use for every Sails request. To add custom          *
  * middleware to the mix, add a function to the middleware config object and *
  * add its key to the "order" array. The $custom key is reserved for         *
  * backwards-compatibility with Sails v0.9.x apps that use the               *
  * `customMiddleware` config option.                                         *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    rawBody: function (req, res, next) {
      if (req.url.indexOf('/api/v1/') !== -1 || req.url.indexOf('/api/paypal-ipn') !== -1) { // for api.mineweb.org or paypal ipn check
        req.rawBody = ''
        req.setEncoding('utf8')

        req.on('data', function (chunk) {
          req.rawBody += chunk
        })

        req.on('end', function () {
          if (req.url.indexOf('/api/paypal-ipn') !== -1)
            req.headers = {}
          next()
        })
      }
      else {
        next()
      }
    },

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP request. (the Sails *
    * router is invoked by the "router" middleware below.)                     *
    *                                                                          *
    ***************************************************************************/

    order: [
      'startRequestTimer',
      'cookieParser',
      'session',
      'expressLogger',
      'rawBody',
      'bodyParser',
      'handleBodyParserError',
      'device',
      'compress',
      'methodOverride',
      'router',
      'www',
      'favicon',
      'errorLogger',
      '404',
      '500'
    ],

    /****************************************************************************
    *                                                                           *
    * Example custom middleware; logs each request to the console.              *
    *                                                                           *
    ****************************************************************************/

    expressLogger: expressLog.logger({
      transports: TRANSPORTS,
      meta: true,
      ignoredRoutes: ['/favicon.ico', '/favicon.png'],
      requestFilter: function (req, propName) {
        var data = req[propName];
        if (propName === 'session')
          return data && data.userId ? data.userId.toString() : undefined;
        return req[propName];
      },
      requestWhitelist: ['url', 'method', 'originalUrl', 'session', 'ip'],
      responseWhitelist: ['statusCode']
    }),

    errorLogger: pmx.expressErrorHandler(),

    device: device.capture()


    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests. By    *
    * default as of v0.10, Sails uses                                          *
    * [skipper](http://github.com/balderdashy/skipper). See                    *
    * http://www.senchalabs.org/connect/multipart.html for other options.      *
    *                                                                          *
    * Note that Sails uses an internal instance of Skipper by default; to      *
    * override it and specify more options, make sure to "npm install skipper" *
    * in your project first.  You can also specify a different body parser or  *
    * a custom function with req, res and next parameters (just like any other *
    * middleware function).                                                    *
    *                                                                          *
    ***************************************************************************/

    // bodyParser: require('skipper')({strict: true})

  },

  /***************************************************************************
  *                                                                          *
  * The number of seconds to cache flat files on disk being served by        *
  * Express static middleware (by default, these files are in `.tmp/public`) *
  *                                                                          *
  * The HTTP static cache is only active in a 'production' environment,      *
  * since that's the only time Express will cache flat-files.                *
  *                                                                          *
  ***************************************************************************/

  cache: 31557600000
};
