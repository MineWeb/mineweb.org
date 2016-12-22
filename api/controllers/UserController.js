/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var reCAPTCHA = require('recaptcha2')
var moment = require('moment')
var async = require('async')
var twoFactor = require('two-factor')
var _ = require('underscore')
var geoip = require('geoip-lite')
var useragent = require('useragent')

module.exports = {

	/*
		Action de connexion, doit être call en ajax
	*/

  login: function (req, res) {
    // On vérifie qu'il ne soit pas déjà connecté
    if (req.session.authenticated !== undefined && req.session.authenticated === true) {
      return res.json({
        status: false,
        msg: req.__("Vous êtes déjà connecté !"),
        inputs: {}
      })
    }

    RequestManagerService.setRequest(req).setResponse(res).valid({
      "Tous les champs ne sont pas remplis.": [
        ['username', "Vous devez spécifier un nom d'utilisateur"],
        ['password', 'Vous devez spécifier un mot de passe']
      ]
    }, function () {

      // On vérifie que l'ip n'est pas bloquée à cause de l'anti-bruteforce
      UserLog.count({
        action: 'TRY_LOGIN',
        ip: CloudflareService.getIP(req),
        createdAt: {
          '>=': (new Date(Date.now() - (60 * 60 * 1000)))
        }
      }).exec(function (err, retries) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        if (retries >= 10) {
          // Bloqué par l'anti-bruteforce
          return res.json({
            status: false,
            msg: req.__("Vous êtes temporairement bloqué ! Vous avez essayé trop de fois le mauvais mot de passe."),
            inputs: {}
          })
        }

        // On vérifie qu'un utilisateur existe avec cet combinaison d'identifiants
        User.findOne({username: req.body.username, password: User.hashPassword(req.body.password) }).populate('tokens').exec(function (err, user) {
          if (err) {
            sails.log.error(err)
            return res.serverError()
          }

          if (user === undefined) {
            // Utilisateur inconnu

            // on stocke dans les logs
            UserLog.create({ action: 'TRY_LOGIN', ip: CloudflareService.getIP(req), status: false, error: 'Invalid credentials'}).exec(function (err, log) {
              if (err) {
                sails.log.error(err)
                return res.serverError()
              }
            })

            // on renvoie le json
            return res.json({
              status: false,
              msg: req.__("Aucun utilisateur ne correspond à ces identifiants."),
              inputs: {}
            })
          }

          // On vérifie que l'email de l'account est bien confirmé
          var validationToken = _.where(user.tokens, {type: 'VALIDATION'})
          if (user.tokens.length > 0 && validationToken.length > 0 && validationToken[0].usedAt === null) {
            return res.json({
              status: false,
              msg: req.__("Vous devez avoir validé votre adresse email avant de pouvoir vous connecter à votre compte."),
              inputs: {}
            })
          }

          // On vérifie si la double auth est active
          if (user.twoFactorAuthKey !== undefined && user.twoFactorAuthKey !== null) {
            // On stocke l'user dans la session temporairement pour la vérification
            user.wantRemember = (req.body.remember_me !== undefined && req.body.remember_me)
            req.session.loginUser = user

            // On répond à l'user pour qu'il soit redirigé
            return res.json({
              status: true,
              msg: req.__("Vous vous êtes bien connecté !"),
              inputs: {},
              twoFactorAuth: true
            })
          }

          // On sauvegarde la session/on le connecte, on gère le cookie de remember
          req.session.userId = user.id

          if (req.body.remember_me !== undefined && req.body.remember_me) {
            // On créé l'entrée dans la table de remember
            var expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            RememberTokens.create({ user: user.id, expireAt: expire }).exec(function (err, token) {
              if (err) sails.log.error(err)
              res.cookie('remember_me',
                {
                  userId: token.user,
                  token: token.token
                },
                {
                  expires: expire, // +1 week
                  signed: true
                }
              )

              // On set la notification toastr
              NotificationService.success(req, req.__('Vous vous êtes bien connecté !'))

              // On lui envoie un message de succès
              res.json({
                status: true,
                msg: req.__("Vous vous êtes bien connecté !"),
                inputs: {}
              })
            })
          }
          else { // Pas de cookie de remember
            // On set la notification toastr
            NotificationService.success(req, req.__('Vous vous êtes bien connecté !'))

            // On lui envoie un message de succès
            res.json({
              status: true,
              msg: req.__("Vous vous êtes bien connecté !"),
              inputs: {}
            })
          }

          // On ajoute une connexion aux logs de connexions de l'utilisateur
          var geo = geoip.lookup(CloudflareService.getIP(req))
          var agent = useragent.parse(req.headers['user-agent'])
          agent = agent.toString()
          UserLog.create({
            action: 'LOGIN',
            ip: CloudflareService.getIP(req),
            user: user.id,
            status: true,
            location: (geo) ? ((geo.city) ? geo.city + ', ' : '') + geo.country : null,
            agent: agent,
            deviceName: req.device.name || null
          }).exec(function (err, log) {
            if (err) {
              sails.log.error(err)
              return res.serverError()
            }

            // find if it's the first connection with this agent + deviceName
            //console.log('Une nouvelle connexion a été détectée sur votre compte depuis ' + geo.city + ', ' + geo.country + ' avec ' + agent + (req.device.name ? '(' + req.device.name + ')' : ''));
          })
        })
      })
    })
  },


	/*
		Action de déconnexion, aucune vue d'affiché
	*/

  logout: function (req, res) {
    // On clear le cookie de remember
    res.clearCookie('remember_me')
    // On supprime les infos dans la session
    req.session.destroy(function (err) {
      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      return res.redirect('/login')
    })
  },

	/*
		Action statique, affichage de la page
	*/

  loginPage: function (req, res) {
    res.locals.title = 'Se connecter ou s\'enregistrer'
    res.render('user/sign')
  },

	/*
		Action d'inscription, doit être call en ajax
	*/

  signup: function (req, res) {
    // Vérifier qu'il est pas déjà connecté
    if (req.session.authenticated !== undefined && req.session.authenticated === true) {
      return res.json({
        status: false,
        msg: req.__("Vous êtes déjà connecté !"),
        inputs: {}
      })
    }

    RequestManagerService.setRequest(req).setResponse(res).valid({
      "Tous les champs ne sont pas remplis.": [
        ['username', "Vous devez spécifier un nom d'utilisateur"],
        ['email', 'Vous devez spécifier un email'],
        ['password', 'Vous devez spécifier un mot de passe'],
        ['password_confirmation', 'Vous devez confirmer votre mot de passe']
      ],
      "Vous devez choisir un pseudo valide !": [
        {
          field: 'username',
          regex: "^([a-zA-Z0-9-_]{4,25})$",
          error: "Le pseudo doit être alphanumérique et entre 4 et 25 caractères."
        }
      ],
      "Vous devez choisir un email valide !": [
        {
          field: 'email',
          regex: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          error: "Cet email n'a pas un format valide."
        }
      ],
      "Les mots de passes ne sont pas identiques !": [
        {
          field: 'password_confirmation',
          value: req.body.password,
          error: 'Le mot de passe doit être identique à celui fourni ci-dessus.'
        }
      ]
    }, function () {

      // Vérifier le captcha
      recaptcha = new reCAPTCHA({
        siteKey: sails.config.recaptcha.siteKey,
        secretKey: sails.config.recaptcha.secretKey
      })

      recaptcha.validateRequest(req).then(function () {


        User.count({ username: req.body.username }).exec(function (err, count) {

          if (err) {
            sails.log.error(err)
            return res.serverError()
          }

          // Pseudo déjà utilisé
          if (count > 0) {
            return res.json({
              status: false,
              msg: req.__("Vous devez choisir un pseudo non utilisé !"),
              inputs: {
                username: req.__("Cet pseudo est déjà utilisé.")
              }
            })
          }

          User.count({ email: req.body.email }).exec(function (err, count) {

            if (err) {
              sails.log.error(err)
              return res.serverError()
            }

            // Pseudo déjà utilisé
            if (count > 0) {
              return res.json({
                status: false,
                msg: req.__("Vous devez choisir un email non utilisé !"),
                inputs: {
                  email: req.__("Cet email est déjà utilisé.")
                }
              })
            }

            // Sauvegarde de l'user
            User.create({ username: req.body.username, password: req.body.password, email: req.body.email, lang: req.acceptedLanguages[0], ip: CloudflareService.getIP(req) }).exec(function (err, user) {

              if (err) {
                sails.log.error(err)
                return res.serverError()
              }

              // Sauvegarde du token de validation, envoie de l'email de confirmation
              Token.create({ user: user.id, type: 'VALIDATION' }).exec(function (err, token) {

                if (err) {
                  sails.log.error(err)
                  return res.serverError()
                }

                // Envoyer le message de succès en JSON
                res.json({
                  status: true,
                  msg: req.__("Vous vous êtes bien inscrit ! Vous devez maintenant confirmer votre email pour pouvoir vous connecter."),
                  inputs: {}
                })

                // On envoie l'email de confirmation
                MailService.send('confirm_email', {
                  url: RouteService.getBaseUrl() + '/user/confirm-email/' + token.token,
                  username: user.username,
                  ip: user.ip
                }, req.__('Confirmation de votre email'), user.email);


              })

            })

          })

        })

      }).catch(function (errorCodes) {
        // invalid
        return res.json({
          status: false,
          msg: req.__("Veuillez valider la sécurité anti-robots"),
          inputs: {
            captcha_msg: req.__("Vous devez prouver que vous êtes un humain en validant l'étape ci-dessus")
          }
        })
      })

    })

  },


	/*
		Action de confirmation d'email
		@params Token
	*/

  confirmEmail: function (req, res) {

    // On récupère le token de validation
    if (req.param('token') === undefined) {
      return res.notFound('Validation token is missing')
    }
    var key = req.param('token')

    // On cherche le token
    Token.findOne({ token: key, type: 'VALIDATION', usedAt: null, usedLocation: null }).exec(function (err, data) {

      if (err) {
        sails.log.error(err)
        return res.serverError('An error occured on token select')
      }

      // Si on ne trouve pas le token
      if (data === undefined) {
        return res.notFound('Unknown validation token or already used')
      }

      // On passe le token en validé
      Token.update({ id: data.id }, { usedAt: (new Date()), usedLocation: CloudflareService.getIP(req) }).exec(function (err, data) {

        if (err) {
          sails.log.error(err)
          return res.serverError('An error occured on token update')
        }

        // On sauvegarde la session/on le connecte
        req.session.userId = data[0].user

        // On set le flash message
        FlashService.success(req, req.__('Vous avez bien validé votre adresse email !'))

        // On redirige l'utilisateur sur son compte
        return res.redirect('/user/profile')


      })

    })

  },

	/*
		Action statique, affichage de la page
	*/

  lostPasswordPage: function (req, res) {
    res.locals.title = "J'ai perdu mon mot de passe"
    res.render('user/lost_password')
  },

	/*
		Action pour envoyer un mail avec un token de rénitialisation de mot de passe
		Doit être call en AJAX
		Data: [email]
	*/

  lostPassword: function (req, res) {
    // On vérifie qu'il ne soit pas déjà connecté
    if (req.session.authenticated !== undefined && req.session.authenticated === true) {
      return res.json({
        status: false,
        msg: req.__("Vous êtes déjà connecté !"),
        inputs: {}
      })
    }

    RequestManagerService.setRequest(req).setResponse(res).valid({
      "Tous les champs ne sont pas remplis.": [
        ['email', 'Vous devez spécifier un email'],
      ]
    }, function () {

      // On vérifie que l'email appartient à un utilisateur
      User.findOne({ email: req.body.email }).exec(function (err, user) {

        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // Si aucun utilisateur ne correspond
        if (user === undefined) {
          return res.json({
            status: false,
            msg: req.__("Aucun utilisateur ne correspond à ces informations"),
            inputs: {
              email: req.__("Vous devez spécifier l'email appartenant à votre compte")
            }
          })
        }

        // On génére le token
        Token.create({ user: user.id, type: 'FORGOT' }).exec(function (err, token) {

          if (err) {
            sails.log.error(err)
            return res.serverError()
          }

          // Envoyer le message de succès en JSON
          res.json({
            status: true,
            msg: req.__("Un email de rénitilisation vous a été envoyé ! Cliquez sur le lien contenu dans celui-ci pour suivre les étapes de rénitilisation."),
            inputs: {}
          })

          // On envoie l'email
          MailService.send('reset_password', {
            url: RouteService.getBaseUrl() + '/user/reset-password/' + token.token,
            username: user.username,
            ip: user.ip
          }, req.__('Rénitialisation de votre mot de passe'), user.email);


        })


      })

    })

  },

	/*
		Action statique, affichage de la page
	*/

  resetPasswordPage: function (req, res) {
    res.locals.title = "Rénitiliser mon mot de passe"
    res.render('user/reset_password')
  },


	/*
		Action pour rénitialiser son mot de passe à partir d'un token de rénitialisation envoyé par email
		Doit être call en AJAX
		Data: [token, password, password_confirmation]
	*/

  resetPassword: function (req, res) {
    // On vérifie qu'il ne soit pas déjà connecté
    if (req.session.authenticated !== undefined && req.session.authenticated === true) {
      return res.json({
        status: false,
        msg: req.__("Vous êtes déjà connecté !"),
        inputs: {}
      })
    }

    RequestManagerService.setRequest(req).setResponse(res).valid({
      "Tous les champs ne sont pas remplis.": [
        ['password', 'Vous devez spécifier un mot de passe'],
        ['password_confirmation', 'Vous devez confirmer votre mot de passe']
      ],
      "Les mots de passes ne sont pas identiques !": [
        {
          field: 'password_confirmation',
          value: req.body.password,
          error: 'Le mot de passe doit être identique à celui fourni ci-dessus.'
        }
      ]
    }, function () {

      // Vérifie le token (expire au bout d'une heure)
      Token.findOne({
        token: req.body.token,
        type: 'FORGOT',
        usedAt: null,
        usedLocation: null,
        createdAt: {
          '>=': (new Date(Date.now() - (60 * 60 * 1000)))
        }
      }).exec(function (err, token) {

        if (err) {
          sails.log.error(err)
          return res.serverError('An error occured on token select')
        }

        // Si on ne trouve pas le token
        if (token === undefined) {
          return res.json({
            status: false,
            msg: req.__("Le token utilisé n'est pas valide ou a déjà expiré"),
            inputs: {}
          })
        }

        // On update le mot de passe
        User.update({ id: token.user }, { password: req.body.password }).exec(function (err, user) {

          if (err) {
            sails.log.error(err)
            return res.serverError('An error occured on token select')
          }


          // On passe le token en utilisé
          Token.update({ id: token.id }, { usedAt: (new Date()), usedLocation: CloudflareService.getIP(req) }).exec(function (err, token) {
            if (err) {
              sails.log.error(err)
            }
          })

          // On envoie la réponse
          return res.json({
            status: true,
            msg: req.__("Vous avez bien éditer votre mot de passe ! Vous pouvez maintenant vous connecter !"),
            inputs: {}
          })

        })


      })

    })

  },

	/*
		Action affichant le profil avec les informations de l'utilisateur
		Authentification requise
	*/

  profile: function (req, res) {
    res.locals.title = req.__("Profil")

    moment.locale(req.acceptedLanguages[0])

    async.parallel([

      // On cherche l'utilisateur avec plus d'infos
      function (callback) {
        User.findOne({ id: req.session.userId }).populate(['paypalPayments', 'dedipassPayments']).exec(callback)
      },

      // on récupère ses paiements paypals
      function (callback) {
        PayPalHistory.find({ user: req.session.userId }).populate(['purchase']).exec(callback)
      },

      // on récupère ses paiements dédipass
      function (callback) {
        DedipassHistory.find({ user: req.session.userId }).populate(['purchase']).exec(callback)
      },

      // On cherche ses logs de connexions
      function (callback) {
        UserLog.find({ user: req.session.userId, action: 'LOGIN' }).limit(5).sort('createdAt DESC').exec(callback)
      },

      // on récupère ses achats
      function (callback) {
        Purchase.findAllOfUser(req.session.userId, callback)
      },

      // get his licenses
      function (callback) {
        License.find({user: req.session.userId}).populate(['hosting']).exec(function (err, licenses) {
          if (err)
            return callback(err)

          var results = {licenses: [], hostings: []}

          for (var i = 0; i < licenses.length; i++) {
            if (licenses[i].hosting) {
              results.hostings.push(licenses[i])
            }
            else {
              results.licenses.push(licenses[i])
            }
          }

          callback(null, results)

        })
      }

    ], function (err, results) {

      if (err) {
        sails.log.error(err);
        return res.serverError();
      }

      res.locals.user = results[0]
      res.locals.user.paypalPayments = results[1]
      res.locals.user.dedipassPayments = results[2]
      res.locals.user.purchases = results[4]
      res.locals.user.createdAt = moment(res.locals.user.createdAt).format('LL')
      res.locals.user.connectionLogs = results[3]
      res.locals.user.licenses = results[5].licenses
      res.locals.user.hostings = results[5].hostings

      res.locals.moment = moment

      res.render('./user/profile')
    })

  },

	/*
		Action modifiant l'email de l'utilisateur
		Data: [email]
		Authentification requise
	*/

  editEmail: function (req, res) {

    RequestManagerService.setRequest(req).setResponse(res).valid({
      "Tous les champs ne sont pas remplis.": [
        ['email', 'Vous devez spécifier un email'],
      ],
      "Vous devez choisir un email valide !": [
        {
          field: 'email',
          regex: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          error: "Cet email n'a pas un format valide."
        }
      ]
    }, function () {

      // On vérifie que l'email n'est pas déjà utilisé
      User.count({ email: req.body.email }).exec(function (err, count) {

        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // L'email est déjà utilisé
        if (count > 0) {
          return res.json({
            status: false,
            msg: req.__("L'email est déjà utilisé par un autre utilisateur !"),
            inputs: {
              email: req.__("Vous devez choisir un email différent")
            }
          })
        }

        // On modifie l'email
        User.update({ id: res.locals.user.id }, { email: req.body.email }).exec(function (err, user) {

          if (err) {
            sails.log.error(err)
            return res.serverError()
          }

          // On envoie une réponse à l'utilisateur
          return res.json({
            status: true,
            msg: req.__("Votre email a bien été modifié !"),
            inputs: {}
          })

        })

      })

    })

  },

	/*
		Action modifiant le mot de passe de l'utilisateur
		Data: [password, password_confirmation]
		Authentification requise
	*/

  editPassword: function (req, res) {

    RequestManagerService.setRequest(req).setResponse(res).valid({
      "Tous les champs ne sont pas remplis.": [
        ['password', 'Vous devez spécifier un mot de passe'],
        ['password_confirmation', 'Vous devez confirmer votre mot de passe']
      ],
      "Les mots de passes ne sont pas identiques !": [
        {
          field: 'password_confirmation',
          value: req.body.password,
          error: 'Le mot de passe doit être identique à celui fourni ci-dessus.'
        }
      ]
    }, function () {

      // On modifie le password
      User.update({ id: res.locals.user.id }, { password: req.body.password }).exec(function (err, user) {

        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // On envoie une réponse à l'utilisateur
        return res.json({
          status: true,
          msg: req.__("Votre mot de passe a bien été modifié !"),
          inputs: {}
        })

      })

    })

  },

	/*
		Action passant la secret key de la double auth à null, redirigeant vers le profil
	*/

  disableTwoFactorAuthentification: function (req, res) {
    // On set la key à null
    User.update({ id: res.locals.user.id }, { twoFactorAuthKey: null }).exec(function (err, user) {

      if (err) {
        sails.log.error(err)
        return res.serverError()
      }

      // On set une notification
      NotificationService.success(req, req.__('Vous avez désactivé la double authentification !'))

      // On envoie l'utilisateur sur son profil
      res.redirect('/user/profile')

    })

  },

	/*
		Action générant la secret key de la double auth, affichant le QRCode
	*/

  enableTwoFactorAuthentificationPage: function (req, res) {

    // On génére la clé secrète
    var secret = twoFactor.generate.key();

    // On la met temporairement dans la session, pour la sauvegarder après
    req.session.twoFactorAuthKey = secret

    // On génère le QRCode
    var code = twoFactor.generate.qrcode(secret, 'MineWeb', 'MineWeb.org - ' + res.locals.user.username, {
      type: 'svg',
      sync: true
    });

    // On rend la view
    res.view('user/enable-two-factor-auth', {
      title: req.__('Activer la double authentification'),
      qrcode: code
    })

  },

	/*
		Action vérifiant le premier code de vérification, sauvegadant la clé de double auth (redirection vers le profil ensuite)
	*/

  enableTwoFactorAuthentification: function (req, res) {

    // On vérifie que la double auth ne soit pas déjà config
    if (res.locals.user.twoFactorAuthKey !== undefined && res.locals.user.twoFactorAuthKey !== null) {
      return res.json({
        status: false,
        msg: req.__("Vous avez déjà la double authentification d'activée !"),
        inputs: {}
      })
    }

    // On vérifie que le champ est rempli
    RequestManagerService.setRequest(req).setResponse(res).valid({
      "Tous les champs ne sont pas remplis.": [
        ['code', "Vous devez rentrer le code de vérification"],
      ]
    }, function () {

      // On set le secret selon ce qui a été enregistré
      var secret = req.session.twoFactorAuthKey

      // On vérifie que le code est valide
      if (!twoFactor.verify(req.body.code, secret)) {
        return res.json({
          status: false,
          msg: req.__("Le code entré est invalide"),
          inputs: {
            email: req.__("Veuillez entrer un code de vérification valide.")
          }
        })
      }

      // On sauvegarde la clé dans la db
      User.update({ id: req.session.userId }, { twoFactorAuthKey: secret }).exec(function (err, user) {

        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

        // On set la notification
        NotificationService.success(req, req.__('Vous avez bien activé la double authentification !'))

        // On envoie le message de succès pour qu'il soit redirigé
        return res.json({
          status: true,
          msg: req.__('Vous avez bien activé la double authentification !'),
          inputs: {}
        })

      })

    })


  },

	/*
		Action statique, affichage de la page
	*/

  loginTwoFactorAuthVerificationPage: function (req, res) {
    res.locals.title = 'Double authentification'
    res.render('user/login-verification-two-factor-auth')
  },

	/*
		Action vérifiant le code de double authentification et connectant l'utilisateur si valide
	*/
  loginTwoFactorAuthVerification: function (req, res) {

    if (req.session.loginUser === undefined ||  req.session.loginUser.length === 0) {
      return res.json({
        status: false,
        msg: req.__("Re-connectez-vous, votre session a expirée."),
        inputs: {}
      })
    }

    // On vérifie que le champ est rempli
    RequestManagerService.setRequest(req).setResponse(res).valid({
      "Tous les champs ne sont pas remplis.": [
        ['code', "Vous devez rentrer le code de vérification"],
      ]
    }, function () {

      // On set le secret selon ce qui a été enregistré
      var secret = req.session.loginUser.twoFactorAuthKey

      // On vérifie que le code est valide
      if (!twoFactor.verify(req.body.code, secret)) {
        return res.json({
          status: false,
          msg: req.__("Le code entré est invalide"),
          inputs: {
            email: req.__("Veuillez entrer un code de vérification valide.")
          }
        })
      }

      // On supprime l'utilisation temporairement de la session
      var user = req.session.loginUser
      req.session.loginUser = undefined

      // On sauvegarde la session/on le connecte, on gère le cookie de remember
      req.session.userId = user.id

      if (user.wantRemember) {

        // On créé l'entrée dans la table de remember
        var expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        RememberTokens.create({ user: user.id, expireAt: expire }).exec(function (err, token) {

          res.cookie('remember_me', {
            userId: token.user,
            token: token.token
          },
            {
              expires: expire, // +1 week
              signed: true
            });

          // On set la notification toastr
          NotificationService.success(req, req.__('Vous vous êtes bien connecté !'))

          // On lui envoie un message de succès
          res.json({
            status: true,
            msg: req.__("Vous vous êtes bien connecté !"),
            inputs: {}
          })

        })
      }
      else {

        // On set la notification toastr
        NotificationService.success(req, req.__('Vous vous êtes bien connecté !'))

        // On lui envoie un message de succès
        res.json({
          status: true,
          msg: req.__("Vous vous êtes bien connecté !"),
          inputs: {}
        })

      }

      // On ajoute une connexion aux logs de connexions de l'utilisateur
      UserLog.create({ action: 'LOGIN', ip: CloudflareService.getIP(req), user: user.id, status: true}).exec(function (err, log) {
        if (err) {
          sails.log.error(err)
          return res.serverError()
        }

      });


    })


  }

};
