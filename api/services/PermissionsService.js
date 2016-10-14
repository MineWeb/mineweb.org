/**
 * PermissionsService
 *
 * @description :: Server-side logic for permissions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Services
 */

var _ = require('underscore')

module.exports = {

  /*
    Return bool if user specified is allowed to access to this path/permission
  */
  can: function (permission, user) {
    // Config
    var permissionsList = sails.config.permissionsList
    var permissionsAccess = sails.config.permissionsAccess

    // authorize to all
    if (permissionsAccess[user.role][0] === '*')
      return true

    // Find permission from path
    if (typeof permission === 'object') {
      if (permission.controller === undefined || permission.action === undefined)
        return false // Params missing

      // Find permission in permissionsList
      for (var permissionKey in permissionsList) {
        if (_.isArray(permissionsList[permissionKey])) { // multiple path for this permission
          // so, for each of it, check if path === permission.path
          for (var i = 0; i < permissionsList[permissionKey].length; i++) {
            if (_.isEqual(permissionsList[permissionKey][i], permission)) {
              var permission = permissionKey // permission found
              break
            }
          }
        }
        else { // only 1 path for this permissin
          if (_.isEqual(permissionsList[permissionKey], permission)) {
            var permission = permissionKey
            break
          }
        }
      }

      if (typeof permission === 'object') // permission not found
        return false
    }

    // Check if user is allowed
    if (permissionsAccess[user.role] !== undefined && permissionsAccess[user.role].indexOf(permission) !== -1)
      return true // Permission finded

    // always return false
    return false
  }

}
