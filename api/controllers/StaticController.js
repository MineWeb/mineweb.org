/**
 * StaticController
 *
 * @description :: Server-side logic for managing Statics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  /*
    Affiche la page d'accueil (/)
    En passant comme variable la dernière version disponible au public du CMS et le titre
  */

  home: function (req, res) {
    Version.getLastVersion(function (version) {
      return res.view('basic-pages/homepage', {
        title: 'Accueil',
        version: version
      })
    })
  },

  /*
    Affiche le changelog (/changelog, /versions)
    En passant comme variables les différentes versions et leurs caractéristiques
  */

  changelog: function (req, res) {
    Version.find().sort('id DESC').exec(function (err, versions) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      return res.view('basic-pages/changelog', {
        title: 'Historique des versions',
        versions: versions
      })
    })
  },

  downloadPage: function (req, res) {
    return res.view('basic-pages/download', {
      title: 'Acheter le CMS'
    })
  },

  buyLicense: function (req, res) {
    return res.view('basic-pages/buy-license', {
      title: 'Acheter une licence'
    })
  },

  rentHosting: function (req, res) {
    var renew = req.param('id')
    return res.view('basic-pages/rent-hosting', {
      title: renew ? 'Renouveler une licence hébergée' : 'Louer une licence hébergée',
      renew: renew
    })
  }

}
