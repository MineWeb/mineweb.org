/**
 * DeveloperController
 *
 * @description :: Server-side logic for managing Developers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')

module.exports = {

  // Display list of user's candidates (with view button only)
  viewCandidates: function (req, res) {
    User.find({developerCandidacy: {'!': null}, developer: 'CANDIDATE'}).exec(function (err, users) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }
      // render
      res.view('admin/developer/view_candidates', {
        title: req.__('Listes des candidatures'),
        users: users || []
      })
    })
  },

  // Display user's id candidate (with comment/accept/refuse buttons)
  viewCandidate: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    User.findOne({developerCandidacy: {'!': null}, developer: 'CANDIDATE', id: id}).exec(function (err, user) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      if (user === undefined) return res.notFound('User not found')
      user = User.addMd5Email(user)

      // render
      res.view('admin/developer/view_candidate', {
        title: req.__('Candidature de %s', user.username),
        user: user
      })
    })
  },

  // Accept user's id candidate, send him an email + update developer's rank into db
  acceptCandidate: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')
    // find user
    User.findOne({developerCandidacy: {'!': null}, developer: 'CANDIDATE', id: id}).exec(function (err, user) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }
      if (user === undefined) return res.notFound('User not found')
      // send email
      MailService.send('developer/accepted_candidacy', {
        url: RouteService.getBaseUrl() + '/developer/',
        username: user.username
      }, req.__('Acceptation de votre candidature de développeur'), user.email)
      // update db
      User.update({developerCandidacy: {'!': null}, developer: 'CANDIDATE', id: id}, {developer: 'CONFIRMED'}).exec(function (err) {
        if (err) sails.log.error(err)
      })
      // send notification
      NotificationService.success(req, req.__('La candidature a bien été acceptée !'))
      // redirect
      res.redirect('/admin/developer/candidate')
    })
  },

  // Refuse user's id candidate, send him an email with an explanation + update developer's rank into db
  refuseCandidate: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    RequestManagerService.setRequest(req).setResponse(res).valid({
			'Tous les champs ne sont pas remplis.': [
				['explanation', '']
			]
		}, function () {
      // find user
      User.findOne({developerCandidacy: {'!': null}, developer: 'CANDIDATE', id: id}).exec(function (err, user) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }
        if (user === undefined) return res.notFound('User not found')
        // send email
        MailService.send('developer/refused_candidacy', {
          url: RouteService.getBaseUrl() + '/developer/',
          username: user.username,
          explanation: req.body.explanation
        }, req.__('Refus de votre candidature de développeur'), user.email)
        // update db
        User.update({developerCandidacy: {'!': null}, developer: 'CANDIDATE', id: id}, {developer: 'NONE'}).exec(function (err) {
          if (err) sails.log.error(err)
        })
        // send notification
        NotificationService.success(req, req.__('La candidature a bien été refusée !'))
        // response to redirect
        res.json({
          status: true,
          msg: req.__('La candidature a bien été refusée !'),
          inputs: {}
        })
      })
    })
  },

  // Display list of plugins/themes new versions and first release (with view button only)
  viewPluginsAndThemesSubmitted: function (req, res) {
    async.parallel([
      // find Plugins
      function (callback) {
        Plugin.find({versions: {'like': '[{"version":"%","public":false,%'}, state: 'CONFIRMED'}).populate(['author']).exec(callback)
      },
      // find themes
      function (callback) {
        Theme.find({versions: {'like': '[{"version":"%","public":false,%'}, state: 'CONFIRMED'}).populate(['author']).exec(callback)
      },
      // find new Plugins
      function (callback) {
        Plugin.find({state: 'UNCONFIRMED'}).populate(['author']).exec(callback)
      },
      // find new themes
      function (callback) {
        Theme.find({state: 'UNCONFIRMED'}).populate(['author']).exec(callback)
      }
    ], function (err, results) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      res.view('admin/developer/view_submitted', {
        title: req.__('Listes des plugins/thèmes soumis'),
        pluginsUpdated: results[0] || [],
        themesUpdated: results[1] || [],
        pluginsAdded: results[2] || [],
        themesAdded: results[3] || []
      })
    })
  },

  // Display plugin release submitted (with only changelog + files unless is the 1st release) with accept/refuse/download buttons
  viewPluginSubmitted: function (req, res) {

  },

  // Display theme release submitted (with only changelog + files unless is the 1st release) with accept/refuse/download buttons
  viewThemeSubmitted: function (req, res) {

  },

  // accept plugin release, send mail to developer, update version to public into 'versions', update 'version' column and send files to API
  acceptPluginSubmitted: function (req, res) {

  },

  // refuse plugin release, send mail to developer with explanation, remove version into 'versions', remove files from server
  refusePluginSubmitted: function (req, res) {

  },

  // accept theme release, send mail to developer, update version to public into 'versions', update 'version' column and send files to API
  acceptThemeSubmitted: function (req, res) {

  },

  // refuse theme release, send mail to developer with explanation, remove version into 'versions', remove files from server
  refuseThemeSubmitted: function (req, res) {

  },

  // display list of plugins and themes released with mini stats (and buttons linked to market plugin/theme's page)
  viewPluginsAndThemesOnline: function (req, res) {
    async.parallel([
      // find Plugins
      function (callback) {
        Plugin.find({state: 'CONFIRMED'}).populate(['author']).exec(callback)
      },
      // find themes
      function (callback) {
        Theme.find({state: 'CONFIRMED'}).populate(['author']).exec(callback)
      }
    ], function (err, results) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      res.view('admin/developer/view_online', {
        title: req.__('Listes des plugins/thèmes en ligne'),
        plugins: results[0] || [],
        themes: results[1] || []
      })
    })
  }

}
