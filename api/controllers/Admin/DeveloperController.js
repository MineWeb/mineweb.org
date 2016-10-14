/**
 * DeveloperController
 *
 * @description :: Server-side logic for managing Developers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  // Display list of user's candidates (with view button only)
  viewCandidates: function (req, res) {

  },

  // Display user's id candidate (with comment/accept/refuse buttons)
  viewCandidate: function (req, res) {

  },

  // Accept user's id candidate, send him an email + update developer's rank into db
  acceptCandidate: function (req, res) {

  },

  // Refuse user's id candidate, send him an email with an explanation + update developer's rank into db
  refuseCandidate: function (req, res) {

  },

  // Display list of plugins/themes new versions and first release (with view button only)
  viewPluginsAndThemesSubmitted: function (req, res) {

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

  }

}
