/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

   connections: {
     mysqlserver: {
       adapter: 'sails-mysql',
       host: 'status.hardfight.fr',
       user: 'mineweb',
       password: 'mineweb42', //optional
       database: 'mineweb' //optional
     },
   },

   hookTimeout: 160000,

   dedipass: {
 		publicKeys: {
 			license: 'a4e7b35c40c18f69431cd8e29f4d9bba',
 			hosting: '45fd9efcda58b6d009ce44cdc7dc73e8'
 		}
 	},

  paypal: {
    sandbox: true,
    //merchantEmail: 'paypal@mineweb.org'
    merchantEmail: 'paypal-facilitator@mineweb.org'
  },

  pushbullet: {
    apiKey: 'o.t2qhJTBxN65oDTc35GN69IeKhYM7OrGv',
    principalEmail: 'mineconstruct@gmail.com'
    //channelTag: 'minewebsupport'
  },

  servers: {
    hosting: {
      host: '188.165.141.113',
      user: 'root',
      password: 'Ly9bt5Q2',
      port: '2435'
    }
  },

  stats: {
    email: 'contact@eywek.fr'
  },

  api: {
    endpoint: 'http://api.mineweb.org/v2/',
    storage: {
      getCMS: 'storage/get_cms'
    }
  },

  developer: {
    upload: {
      folders: {
        plugins: 'uploads/plugins',
        themes: 'uploads/themes',
      }
    }
  },

  permissionsList: {
    'ADMIN-ACCESS_DASHBOARD': {
      controller: 'admin/dashboard',
      action: 'index'
    },
    'ADMIN-VIEW_TICKETS': {
      controller: 'admin/ticket',
      action: 'index'
    },
    'ADMIN-CLOSE_TICKET': {
      controller: 'admin/ticket',
      action: 'close'
    },
    'ADMIN-VIEW_TICKET': {
      controller: 'admin/ticket',
      action: 'view'
    },
    'ADMIN-EDIT_CATEGORY_TICKET': {
      controller: 'admin/ticket',
      action: 'editCategory'
    },
    'ADMIN-EDIT_STATE_TICKET': {
      controller: 'admin/ticket',
      action: 'editState'
    },
    'ADMIN-TAKE_TICKET': {
      controller: 'admin/ticket',
      action: 'take'
    },
    'ADMIN-REPLY_TICKET': {
      controller: 'admin/ticket',
      action: 'reply'
    },
    'ADMIN-VIEW_SETTINGS': {
      controller: 'admin/dashboard',
      action: 'settings'
    },
    'ADMIN-UPDATE_SETTINGS': {
      controller: 'admin/dashboard',
      action: 'updateSettings'
    },
    'ADMIN-FIND_LICENSE_OR_HOSTING': {
      controller: 'admin/license',
      action: 'findPage'
    },
    'ADMIN-FIND_LICENSE': {
      controller: 'admin/license',
      action: 'find'
    },
    'ADMIN-FIND_HOSTING': {
      controller: 'admin/hosting',
      action: 'find'
    },
    'ADMIN-SUSPEND_LICENSE': {
      controller: 'admin/license',
      action: 'suspend'
    },
    'ADMIN-UNSUSPEND_LICENSE': {
      controller: 'admin/license',
      action: 'unsuspend'
    },
    'ADMIN-GET_DEBUG_LICENSE': {
      controller: 'admin/license',
      action: 'getDebug'
    }
  },

  permissionsAccess: {
    'USER': [],
    'DEVELOPER': [],
    'MOD': [
      // 'ADMIN-ACCESS_DASHBOARD',
      'ADMIN-VIEW_TICKETS',
      'ADMIN-CLOSE_TICKET',
      'ADMIN-VIEW',
      'ADMIN-EDIT_CATEGORY_TICKET',
      'ADMIN-EDIT_STATE_TICKET',
      'ADMIN-TAKE_TICKET',
      'ADMIN-REPLY_TICKET',
      'ADMIN-VIEW_SETTINGS',
      'ADMIN-UPDATE_SETTINGS',
      'ADMIN-FIND_LICENSE_OR_HOSTING',
      'ADMIN-FIND_LICENSE',
      'ADMIN-FIND_HOSTING',
      //'ADMIN-SUSPEND_LICENSE',
      //'ADMIN-UNSUSPEND_LICENSE',
      'ADMIN-GET_DEBUG_LICENSE'
    ],
    'ADMIN': [
      'ADMIN-ACCESS_DASHBOARD',
      'ADMIN-VIEW_TICKETS',
      'ADMIN-CLOSE_TICKET',
      'ADMIN-VIEW',
      'ADMIN-EDIT_CATEGORY_TICKET',
      'ADMIN-EDIT_STATE_TICKET',
      'ADMIN-TAKE_TICKET',
      'ADMIN-REPLY_TICKET',
      'ADMIN-VIEW_SETTINGS',
      'ADMIN-UPDATE_SETTINGS',
      'ADMIN-FIND_LICENSE_OR_HOSTING',
      'ADMIN-FIND_LICENSE',
      'ADMIN-FIND_HOSTING',
      'ADMIN-SUSPEND_LICENSE',
      'ADMIN-UNSUSPEND_LICENSE',
      'ADMIN-GET_DEBUG_LICENSE'
    ],
    'FOUNDER': ['*']
  },

  ticket: {
    'fr-fr': {
      hello: {
        day: 'Bonjour,',
        night: 'Bonsoir,'
      },
      signature: "Cordialement,<br>{USERNAME}.<br>{ROLENAME}"
    }
  }

};
