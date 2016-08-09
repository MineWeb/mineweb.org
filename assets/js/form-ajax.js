function initForms() {

  $('form[data-ajax]').unbind('submit')

  $('form[data-ajax]').on('submit', function(e) {

    // On empêche la redirection
      e.preventDefault()

    // On set quelques variables
      var form = $(this)
      var submit_btn = $(this).find('button[type="submit"]')
      var submit_btn_content = submit_btn.html() // On récupère le contenu du bouton pour le remettre plus tard

    // On met en place la div de message si elle existe pas encore
      if ($(form).find('div.ajax-msg').length == 0) {
        $(form).prepend('<div class="ajax-msg"></div>')
      }
      var msg = $(form).find('div.ajax-msg')

    // On met le message de chargement
      msg.hide().html('<div class="alert alert-info">'+locals.LOADING_MSG+'</div>').fadeIn(200)

    // On désactive le bouton de submit
      submit_btn.addClass('disabled').attr('disabled', true).html(locals.LOADING_MSG)

    // On vire les éventuelles classes d'erreurs
    console.log(form.find('.has-danger'));
      form.find('.has-danger').each(function() {
        console.log(this)
        $(this).removeClass('has-danger')
      })
      form.find('.form-control-danger').each(function() {
        $(this).removeClass('form-control-danger')
      })
      form.find('.form-control-feedback').remove()

    // On récupère les données
      var inputs = (window.FormData) ? new FormData(form[0]) : null


    // On effectue la requête
      $.ajax ({
        url: form.attr('action'),
        data: inputs,
        method: form.attr('method'),
        dataType: 'json',
        contentType: false,
        processData: false,
        success: function (json) {

          if (json.status === true) {
            if (form.attr('data-success-msg') === undefined || form.attr('data-success-msg') == "true") {
              div_msg.html('<div class="alert alert-success"><b>'+locals.SUCCESS_MSG+' :</b> '+json.msg+'</div>').fadeIn(200)
            }
            if (form.attr('data-callback-function') !== undefined) {
              window[form.attr('data-callback-function')](inputs, json)
            }
            if (form.attr('data-redirect-url') !== undefined) {
              document.location.href=form.attr('data-redirect-url')+'?no-cache='+ (new Date()).getTime()
            }
            submit_btn.html(submit_btn_content).removeClass('disabled').attr('disabled', false).fadeIn(500)
          } else if (json.status === false) {


            // On met des erreurs HTML directement si il y a une erreur
              if (json.inputs !== undefined && typeof json.inputs === 'object') {
                for (var input_name in json.inputs) {

                  // On set les variables
                  var input = form.find('[name='+input_name+']');
                  var form_group = input.parent();

                  // On met l'HTML
                  form_group.addClass('has-danger');
                  input.addClass('form-control-danger');
                  $('<div class="form-control-feedback">'+json.inputs[input_name]+'</div>').insertAfter(input);

                }
              }

            msg.html('<div class="alert alert-danger"><b>'+locals.ERROR_MSG+' :</b> '+json.msg+'</div>').fadeIn(200)
            submit_btn.html(submit_btn_content).removeClass('disabled').attr('disabled', false)

          } else {

            msg.html('<div class="alert alert-danger"><b>'+locals.ERROR_MSG+' :</b> '+locals.INTERNAL_ERROR_MSG+'</div>')
            submit_btn.html(submit_btn_content).removeClass('disabled').attr('disabled', false)

          }
        },
        error : function (xhr) {

          if (xhr.status == "403") {
            msg.html('<div class="alert alert-danger"><b>'+locals.ERROR_MSG+' :</b> '+locals.FORBIDDEN_ERROR_MSG+'/div>')
          } else {
            msg.html('<div class="alert alert-danger"><b>'+locals.ERROR_MSG+' :</b> '+locals.INTERNAL_ERROR_MSG+'</div>')
          }
          submit_btn.html(submit_btn_content).removeClass('disabled').attr('disabled', false)
        }
      })


  })

}

initForms()
