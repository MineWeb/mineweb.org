/**
 * DeveloperController
 *
 * @description :: Server-side logic for managing Developers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async')
var path = require('path')
var pump = require('pump')
var fs = require('fs')
var slugify = require('slugify')
var moment = require('moment')
var request = require('request')

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
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    Plugin.findOne({
      or: [
        {id: id, versions: {'like': '[{"version":"%","public":false,%'}, state: 'CONFIRMED'},
        {id: id, state: 'UNCONFIRMED'}
      ]
    }).populate(['author']).exec(function (err, plugin) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }
      if (plugin === undefined) return res.notFound()

      res.view('admin/developer/view_plugin_submitted', {
        title: req.__('Plugin "%s"', plugin.name),
        plugin: plugin
      })
    })
  },

  // Display theme release submitted (with only changelog + files unless is the 1st release) with accept/refuse/download buttons
  viewThemeSubmitted: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    Theme.findOne({
      or: [
        {id: id, versions: {'like': '[{"version":"%","public":false,%'}, state: 'CONFIRMED'},
        {id: id, state: 'UNCONFIRMED'}
      ]
    }).populate(['author']).exec(function (err, theme) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }
      if (theme === undefined) return res.notFound()

      res.view('admin/developer/view_theme_submitted', {
        title: req.__('Thème "%s"', theme.name),
        theme: theme
      })
    })
  },

  // Download plugin release submitted
  downloadPluginSubmitted: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    Plugin.findOne({
      or: [
        {id: id, versions: {'like': '[{"version":"%","public":false,%'}, state: 'CONFIRMED'},
        {id: id, state: 'UNCONFIRMED'}
      ]
    }).exec(function (err, plugin) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }
      if (plugin === undefined) return res.notFound()

      var filename = (plugin.state === 'CONFIRMED') ? plugin.author + '-' + plugin.slug + '-v' + plugin.versions[0].version + '.zip' : plugin.author + '-' + slugify(plugin.name) + '.zip'
      var pluginPath = path.join(__dirname, '../../../', sails.config.developer.upload.folders.plugins, filename)

      // write header
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Length': fs.statSync(pluginPath).size,
        'Content-Disposition': 'attachment; filename=' + slugify(plugin.name) + '-v' + plugin.version + '.zip'})

      // stream the file to the response
      pump(fs.createReadStream(pluginPath), res)
    })
  },

  // Download theme release submitted
  downloadThemeSubmitted: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    Theme.findOne({
      or: [
        {id: id, versions: {'like': '[{"version":"%","public":false,%'}, state: 'CONFIRMED'},
        {id: id, state: 'UNCONFIRMED'}
      ]
    }).exec(function (err, theme) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }
      if (theme === undefined) return res.notFound()

      var filename = (theme.state === 'CONFIRMED') ? theme.author + '-' + theme.slug + '-v' + theme.versions[0].version + '.zip' : theme.author + '-' + slugify(theme.name) + '.zip'
      var themePath = path.join(__dirname, '../../../', sails.config.developer.upload.folders.themes, filename)

      // write header
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Length': fs.statSync(themePath).size,
        'Content-Disposition': 'attachment; filename=' + slugify(theme.name) + '-v' + theme.version + '.zip'})

      // stream the file to the response
      pump(fs.createReadStream(themePath), res)
    })
  },

  // accept plugin release, send mail to developer, update version to public + update releaseDate into 'versions', update 'version' column and send files to API
  acceptPluginSubmitted: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    Plugin.findOne({
      or: [
        {id: id, versions: {'like': '[{"version":"%","public":false,%'}, state: 'CONFIRMED'},
        {id: id, state: 'UNCONFIRMED'}
      ]
    }).populate(['author']).exec(function (err, plugin) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }
      if (plugin === undefined) return res.notFound()
      // check slug
      if (plugin.state === 'UNCONFIRMED' && (req.body.slug === undefined || req.body.slug.length === 0)) {
        return res.json({
          status: false,
          msg: req.__('Vous devez spécifier un slug !'),
          inputs: {}
        })
      }

      // version update
      var version = plugin.versions[0]
      version.public = true // set public
      version.releaseDate = moment((new Date())).format('YYYY-MM-DD HH:mm:ss') // set release date
      plugin.versions[0] = version

      // data to update
      var data = {
        version: version.version, // update current version
        versions: plugin.versions
      }
      if (plugin.state === 'UNCONFIRMED') { // first release of a plugin
        data.state = 'CONFIRMED'
        data.slug = req.body.slug
        if (req.body.official && req.body.official === 'on')
          data.official = true
      }

      // send to API
      var r = request.post(sails.config.api.endpointWithoutVersion + sails.config.api.storage.upload, form, function (err, httpResponse, body) {
        if (err || httpResponse.statusCode !== 200) {
          sails.log.error(err || httpResponse.statusCode)
          return res.serverError(body)
        }
        // update plugin
        Plugin.update({id: id}, data, function (err, plugins) {
          if (err) {
            sails.log.error(err)
            return res.serverError()
          }
          var pluginUpdated = plugins[0]

          // remove file from server
          fs.unlink(pluginPath, function (err) {
            if (err) sails.log.error(err)
          })
          // send email
          MailService.send('developer/accepted_plugin', {
            url: RouteService.getBaseUrl() + '/developer/',
            username: plugin.author.username,
            pluginName: plugin.name
          }, req.__('Acceptation de votre plugin'), plugin.author.email)
          // send notification
          NotificationService.success(req, req.__('Le plugin a bien été accepté !'))
          // response to redirect
          return res.json({
            status: true,
            msg: req.__('Le plugin a bien été accepté !'),
            inputs: {},
            plugin: pluginUpdated
          })
        })
      })
      // construct form
      var form = r.form()
      form.append('type', 'PLUGIN')
      form.append('version', data.version)
      form.append('slug', data.slug || plugin.slug)
      form.append('id', plugin.id)
      var filename = (plugin.state === 'CONFIRMED') ? plugin.author.id + '-' + plugin.slug + '-v' + plugin.versions[0].version + '.zip' : plugin.author.id + '-' + slugify(plugin.name) + '.zip'
      var pluginPath = path.join(__dirname, '../../../', sails.config.developer.upload.folders.plugins, filename)
      form.append('file', fs.createReadStream(pluginPath))
    })
  },

  // refuse plugin release, send mail to developer with explanation, remove version into 'versions', remove files from server
  refusePluginSubmitted: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    Plugin.findOne({
      or: [
        {id: id, versions: {'like': '[{"version":"%","public":false,%'}, state: 'CONFIRMED'},
        {id: id, state: 'UNCONFIRMED'}
      ]
    }).populate(['author']).exec(function (err, plugin) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }
      if (plugin === undefined) return res.notFound()
      // check explanation
      if (req.body.explanation === undefined || req.body.explanation.length === 0) {
        return res.json({
          status: false,
          msg: req.__('Vous devez spécifier une raison !'),
          inputs: {}
        })
      }

      // version update
      var version = plugin.versions[0].version
      if (plugin.state === 'CONFIRMED')
        plugin.versions.shift() // remove version

      // data to update
      var data = {
        versions: plugin.versions
      }
      if (plugin.state === 'UNCONFIRMED') // first release of a plugin
        data.state = 'DELETED'

      // update plugin
      Plugin.update({id: id}, data, function (err, plugins) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }
        var pluginUpdated = plugins[0]

        // remove file from server
        var filename = (plugin.state === 'CONFIRMED') ? plugin.author.id + '-' + plugin.slug + '-v' + version + '.zip' : plugin.author.id + '-' + slugify(plugin.name) + '.zip'
        var pluginPath = path.join(__dirname, '../../../', sails.config.developer.upload.folders.plugins, filename)
        fs.unlink(pluginPath, function (err) {
          if (err) sails.log.error(err)
        })
        // send email
        MailService.send('developer/refused_plugin', {
          url: RouteService.getBaseUrl() + '/developer/',
          username: plugin.author.username,
          pluginName: plugin.name,
          explanation: req.body.explanation
        }, req.__('Refus de votre plugin'), plugin.author.email)
        // send notification
        NotificationService.success(req, req.__('Le plugin a bien été refusé !'))
        // response to redirect
        return res.json({
          status: true,
          msg: req.__('Le plugin a bien été refusé !'),
          inputs: {},
          plugin: pluginUpdated
        })
      })
    })
  },

  // accept theme release, send mail to developer, update version to public into 'versions', update 'version' column and send files to API
  acceptThemeSubmitted: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    Theme.findOne({
      or: [
        {id: id, versions: {'like': '[{"version":"%","public":false,%'}, state: 'CONFIRMED'},
        {id: id, state: 'UNCONFIRMED'}
      ]
    }).populate(['author']).exec(function (err, theme) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }
      if (theme === undefined) return res.notFound()
      // check slug
      if (theme.state === 'UNCONFIRMED' && (req.body.slug === undefined || req.body.slug.length === 0)) {
        return res.json({
          status: false,
          msg: req.__('Vous devez spécifier un slug !'),
          inputs: {}
        })
      }

      // version update
      var version = theme.versions[0]
      version.public = true // set public
      version.releaseDate = moment((new Date())).format('YYYY-MM-DD HH:mm:ss') // set release date
      theme.versions[0] = version

      // data to update
      var data = {
        version: version.version, // update current version
        versions: theme.versions
      }
      if (theme.state === 'UNCONFIRMED') { // first release of a theme
        data.state = 'CONFIRMED'
        data.slug = req.body.slug
        if (req.body.official && req.body.official === 'on')
          data.official = true
      }

      // send to API
      var r = request.post(sails.config.api.endpointWithoutVersion + sails.config.api.storage.upload, form, function (err, httpResponse, body) {
        if (err || httpResponse.statusCode !== 200) {
          sails.log.error(err || httpResponse.statusCode)
          return res.serverError(body)
        }
        // update theme
        Theme.update({id: id}, data, function (err, themes) {
          if (err) {
            sails.log.error(err)
            return res.serverError()
          }
          var themeUpdated = themes[0]

          // remove file from server
          fs.unlink(themePath, function (err) {
            if (err) sails.log.error(err)
          })
          // send email
          MailService.send('developer/accepted_theme', {
            url: RouteService.getBaseUrl() + '/developer/',
            username: theme.author.username,
            themeName: theme.name
          }, req.__('Acceptation de votre thème'), theme.author.email)
          // send notification
          NotificationService.success(req, req.__('Le thème a bien été accepté !'))
          // response to redirect
          return res.json({
            status: true,
            msg: req.__('Le thème a bien été accepté !'),
            inputs: {},
            theme: themeUpdated
          })
        })
      })
      // construct form
      var form = r.form()
      form.append('type', 'THEME')
      form.append('version', data.version)
      form.append('slug', data.slug || theme.slug)
      form.append('id', theme.id)
      var filename = (theme.state === 'CONFIRMED') ? theme.author.id + '-' + theme.slug + '-v' + theme.versions[0].version + '.zip' : theme.author.id + '-' + slugify(theme.name) + '.zip'
      var themePath = path.join(__dirname, '../../../', sails.config.developer.upload.folders.themes, filename)
      form.append('file', fs.createReadStream(themePath))
    })
  },

  // refuse theme release, send mail to developer with explanation, remove version into 'versions', remove files from server
  refuseThemeSubmitted: function (req, res) {
    if (req.param('id') === undefined) {
      return res.notFound('Id is missing')
    }
    var id = req.param('id')

    Theme.findOne({
      or: [
        {id: id, versions: {'like': '[{"version":"%","public":false,%'}, state: 'CONFIRMED'},
        {id: id, state: 'UNCONFIRMED'}
      ]
    }).populate(['author']).exec(function (err, theme) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }
      if (theme === undefined) return res.notFound()
      // check explanation
      if (req.body.explanation === undefined || req.body.explanation.length === 0) {
        return res.json({
          status: false,
          msg: req.__('Vous devez spécifier une raison !'),
          inputs: {}
        })
      }

      // version update
      var version = theme.versions[0].version
      if (theme.state === 'CONFIRMED')
        theme.versions.shift() // remove version

      // data to update
      var data = {
        versions: theme.versions
      }
      if (theme.state === 'UNCONFIRMED') // first release of a theme
        data.state = 'DELETED'

      // update theme
      Theme.update({id: id}, data, function (err, themes) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }
        var themeUpdated = themes[0]

        // remove file from server
        var filename = (theme.state === 'CONFIRMED') ? theme.author.id + '-' + theme.slug + '-v' + version + '.zip' : theme.author.id + '-' + slugify(theme.name) + '.zip'
        var themePath = path.join(__dirname, '../../../', sails.config.developer.upload.folders.themes, filename)
        fs.unlink(themePath, function (err) {
          if (err) sails.log.error(err)
        })
        // send email
        MailService.send('developer/refused_theme', {
          url: RouteService.getBaseUrl() + '/developer/',
          username: theme.author.username,
          themeName: theme.name,
          explanation: req.body.explanation
        }, req.__('Refus de votre thème'), theme.author.email)
        // send notification
        NotificationService.success(req, req.__('Le thème a bien été refusé !'))
        // response to redirect
        return res.json({
          status: true,
          msg: req.__('Le thème a bien été refusé !'),
          inputs: {},
          theme: themeUpdated
        })
      })
    })
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
