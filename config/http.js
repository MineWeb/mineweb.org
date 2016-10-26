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

var TRANSPORTS = [];
if (process.env.NODE_ENV === 'production') {
  var elasticTransport = new ESTransport({
    level: 'info',
    indexPrefix: 'main-express',
    mappingTemplate: require('./es_log_mapping.json'),
    clientOpts: { host: '51.255.36.38:9200', apiVersion: 'master' },
    transformer: function (logData) {
      const transformed = {};
      transformed['@timestamp'] = new Date().toISOString();
      transformed['@level'] = logData.level;
      transformed['@version'] = 1;
      transformed.fields = logData.meta;
      return transformed;
    }
  });

  elasticTransport.emitErrs = true;
  elasticTransport.on('error', function (err) {
    pmx.notify(err);
  });
  TRANSPORTS.push(elasticTransport)
}
else
  TRANSPORTS.push(new winston.transports.Console({ json: false, colorize: true }))

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
      if (req.url.indexOf('/api/v1/') !== -1) {
        req.rawBody = ''
        req.setEncoding('utf8')

        req.on('data', function (chunk) {
          req.rawBody += chunk
        })

        req.on('end', function () {
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
        if (propName === 'headers')
          return { agent: data["user-agent"], language: data["accept-language"], origin: data.origin, host: data.host }
        if (propName === 'session')
          return data && data.userId ? data.userId.toString() : undefined;
        return req[propName];
      },
      requestWhitelist: ['url', 'headers', 'method', 'originalUrl', 'session', 'ip'],
      responseWhitelist: ['statusCode']
    }),

    errorLogger: pmx.expressErrorHandler()


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
