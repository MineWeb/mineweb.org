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

   hookTimeout: 40000,

   dedipass: {
 		publicKeys: {
 			license: 'a4e7b35c40c18f69431cd8e29f4d9bba',
 			hosting: '45fd9efcda58b6d009ce44cdc7dc73e8'
 		}
 	},

  paypal: {
    sandbox: true
  }

};
