var PushBullet = require('pushbullet')
var pusher = new PushBullet(sails.config.pushbullet.apiKey)
var async = require('async')

module.exports = {

  push: function (title, link, modelName, modelId, emails) {
    if (emails === undefined) {
      // Find all users with a 'pushbulletEmail'
      User.find({pushbulletEmail: {'!': null}}).exec(function (err, users) {
        if (err) {
          sails.log.error(err)
          return callback()
        }

        async.forEach(users, function (user, callback) {
          sendNotification(user.pushbulletEmail, function () {
            callback()
          })
        }, function () {
          return true
        })

      })
    }
    else {
      async.forEach(emails, function (email, callback) {
        sendNotification(email, function () {
          callback()
        })
      }, function () {
        return true
      })
    }

    function sendNotification(email, callback) {

      // Push with module
      pusher.link(email, title, link, function(err, response) {
        if (err) {
          sails.log.error(err)
          return callback()
        }

        // Save notification
        Pushbullet.create({
          iden: response.iden,
          modelName: modelName,
          modelId: modelId
        }).exec(function (err, entry) {

          if (err)
            sails.log.error(err)

          return callback()

        })
      })

    }

  },

  delete: function (modelName, modelId) {

    // Find notification
    Pushbullet.find({modelName: modelName, modelId: modelId}).exec(function (err, notifications) {

      if (err)
        return sails.log.error(err)

      if (notifications === undefined)
        return true

      async.forEach(notifications, function (notification, callback) {

        // Delete from pushbullet
        pusher.deletePush(notification.iden, function (error, response) {
          if (error)
            return sails.log.error(error)
        })
        callback()

      }, function () {
        // Delete all from db
        Pushbullet.destroy({modelName: modelName, modelId: modelId}).exec(function (err) {
          if (err)
            return sails.log.error(err)
          return true
        })
      })

    })

  },

}
