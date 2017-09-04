/**
 * MailService
 *
 * @description :: Useful functions for generate urls
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Services
 */

module.exports = {

  /**
   * Generate base url
   */
  getBaseUrl: function () {
    var usingSSL = sails.config.ssl && sails.config.ssl.key && sails.config.ssl.cert
    var port = sails.config.proxyPort || sails.config.port
    var localAppURL =
      //(usingSSL ? 'https' : 'http') + '://' +
      (process.env.NODE_ENV === 'development' ? 'http://localhost' : 'https://mineweb.org') +
      (/* port === 80 || port === 443*/process.env.NODE_ENV !== 'development' ? '' : ':' + port)

    return localAppURL
    // return 'http://192.168.1.24:1337'
  }

}
