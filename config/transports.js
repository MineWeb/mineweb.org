
// logger logic
var winston = require('winston');
var ESTransport = require('winston-elasticsearch');

var TRANSPORTS = [];
if (process.env.NODE_ENV === 'production') {
  var elasticTransport = new ESTransport({ level: 'info', clientOpts: { indexPrefix: 'main-express', host: sails.config.elasticsearch_uri } });

  elasticTransport.emitErrs = true;
  elasticTransport.on('error', function (err) {
    pmx.notify(err);
  });
  TRANSPORTS.push(elasticTransport)
}
else
  TRANSPORTS.push(new winston.transports.Console({ json: false, colorize: true }))


// put them in global since the config will use them
module.exports = { transports: TRANSPORTS };