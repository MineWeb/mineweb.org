/**
 * MailService
 *
 * @description :: Useful functions for generate urls
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Services
 */

module.exports = {

  /*
    SET VARS
  */
  setRequest: function (request) {
    this.request = request
    return this
  },
  setResponse: function (response) {
    this.response = response
    return this
  },

  /**
   * Valid a request with validation arg and execute next() function at the end
   */
  valid: function (validationRules, next) {

    /*
      VALIDATION
    */

    // On parcours les groupes de validation
    for (var globalError in validationRules) {

      this.inputs = {}

      for (var i = 0; i < validationRules[globalError].length; i++) {
        // Si c'est un tableau, on le transforme en objet avec les valeurs de validation par défaut
        if (Array.isArray(validationRules[globalError][i])) {
          validationRules[globalError][i] = {
            field: validationRules[globalError][i][0],
            empty: false,
            error: validationRules[globalError][i][1]
          }
        }
        // On fait la validation
        if (this.validForm(validationRules[globalError][i], globalError) === false) {
          var error = true
        }

      }

      if (error !== undefined) {
        this.sendError(globalError, this.inputs)
        return false
      }

    }

    /*
      CALLBACK
    */
    next()
	},

  /**
   * Valid forms
   */
  validForm: function (validation) {

    if (validation.empty === false) {
      if (this.request.body[validation.field] === undefined || this.request.body[validation.field].length === 0) {
        this.inputs[validation.field] = this.request.__(validation.error)
        return false
      }
    }

    if (validation.regex !== undefined) {
      if (!(new RegExp(validation.regex).test(this.request.body[validation.field]))) {
        this.inputs[validation.field] = this.request.__(validation.error)
        return false
      }
    }

    if (validation.value !== undefined) {
      if (validation.strict === undefined)
        validation.strict = false

      if ((validation.strict && this.request.body[validation.field] !== validation.value) || (!validation.strict && this.request.body[validation.field] != validation.value)) {

        this.inputs[validation.field] = this.request.__(validation.error)
        return false

      }
    }

    return true
  },

  /**
   * Send an error to navigator (for ajax calls)
   */
  sendError: function (message, inputs) {
    return this.response.json({
      status: false,
      msg: this.request.__(message),
      inputs: this.inputs
    })
  }

};
