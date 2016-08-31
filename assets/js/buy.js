/*
  CHOOSE PAYMENT TYPE
*/

$('.btn-pay:not(.disabled)').on('click', function(e) {
  e.preventDefault()

  if ($(this).not('.disabled').length > 0) {

    var btn = $(this)
    var paymentType = btn.attr('data-payment-type')

    $('.btn-pay').removeClass('active')
    btn.addClass('active')

    if (paymentType === 'paypal') {
      $('th#paypalAmount').fadeIn(100)
      $('td#dedipassAmount').fadeOut(100)
      $('tr#paypalFees').fadeIn(100)
    }
    else if (paymentType === 'dedipass') {
      $('th#paypalAmount').fadeOut(100)
      $('td#dedipassAmount').fadeIn(100)
      $('tr#paypalFees').fadeOut(100)
    }
    else {
      alert('Unknown payment type !')
    }

  }

})

/*
  CHECK VOUCHER
*/

$('#checkVoucher').on('click', function(e) {

  // Cancel default behavior
  e.preventDefault()

  // Init vars
  var btn = $(this)
  var btnContent = btn.html() // get current btn content (re-set after)

  btn.html('<i class="fa fa-refresh fa-spin"></i>') // set spinner
  btn.addClass('disabled').attr('disabled', true) // block multiple clicks

  var input = $('input[name="voucher"]') // get input
  var voucher = input.val() // get input value for check

  // get offer price
  var price = parseFloat(btn.attr('data-price'))

  // default paypal fees
  var defaultPayPalFees = $('#paypalFeesAmount').attr('data-default-fees')

  // Check
  $.ajax({
    method: 'get',
    dataType: 'json',
    url: '/purchase/checkVoucher/'+voucher+'/'+price,
    success: function(data) {

      if (data.status) {

        // Caculate new price
        var newPrice = data.newPrice

        // If price not empty, can only pay with PayPal
        if (newPrice > 0) {
          // Select PayPal
          $('.btn-pay[data-payment-type="paypal"]').click()
          // Disable Dedipass & add warning
          $('.btn-pay[data-payment-type="dedipass"]').attr('disabled', true).addClass('disabled').attr('style', '')
          $('.warning-voucher').fadeIn(100)

          // edit payment btn
          $('#pay').html($('#pay').attr('data-content-if-not-free'))
        }
        else {
          // edit payment btn
          $('#pay').html($('#pay').attr('data-content-if-free'))
        }

        // Edit price reduction
        $('.voucher-reduction').html('- '+data.voucher.amount+' €')

        // Edit price total
        $('.amount').html(newPrice+' €')

        // Edit fees
        $('#paypalFeesAmount').html(data.paypalFees+' €')

        // re-set btn content
        btn.html(btnContent)
        // enable btn
        btn.removeClass('disabled').attr('disabled', false)

      }
      else {
        this.error()
      }

    },
    error: function() {
      // re-set btn content
      btn.html(btnContent)
      // enable btn
      btn.removeClass('disabled').attr('disabled', false)
      // enable dedipass
      $('.btn-pay[data-payment-type="dedipass"]').attr('disabled', false).removeClass('disabled')
      if ($('.btn-pay[data-payment-type="dedipass"]').css('opacity') == 0.7) {
        $('.btn-pay[data-payment-type="dedipass"]').css('opacity', 0.5)
      }
      // delete warning
      $('.warning-voucher').fadeOut(100)
      // edit payment btn
      $('#pay').html($('#pay').attr('data-content-if-not-free'))

      // Edit price reduction
      $('.voucher-reduction').html('- 0.00 €')

      // Edit price total
      var totalPrice = parseFloat(price)+parseFloat(defaultPayPalFees)
      $('#paypalAmount').html(totalPrice+' €')
      $('#dedipassAmount').html($('#dedipassAmount').attr('data-default-price'))

      // Edit fees
      $('#paypalFeesAmount').html(defaultPayPalFees+' €')
    }
  })



})

/*
  CHECK SUBDOMAIN (FOR HOSTING)
*/

$('#checkSubdomain').on('click', function(e) {

  // Cancel default behavior
  e.preventDefault()

  // Init vars
  var btn = $(this)
  var btnContent = btn.html() // get current btn content (re-set after)

  btn.html('<i class="fa fa-refresh fa-spin"></i>') // set spinner
  btn.addClass('disabled').attr('disabled', true) // block multiple clicks

  var input = $('input[name="custom"]') // get input
  var subdomain = input.val() // get input value for check

  // Check
  $.ajax({
    method: 'get',
    dataType: 'json',
    url: '/purchase/checkHostingSubdomainAvailability/'+subdomain,
    success: function(data) {

      if (data.status) {

        $('#subdomainWaitStatus').hide()
        $('#subdomainAvailable').hide()
        $('#subdomainNotAvailable').hide()

        if (data.available)
          $('#subdomainAvailable').fadeIn(100)
        else
          $('#subdomainNotAvailable').fadeIn(100)

        // re-set btn content
        btn.html(btnContent)
        // enable btn
        btn.removeClass('disabled').attr('disabled', false)

      }
      else {
        this.error()
      }

    },
    error: function() {
      // re-set btn content
      btn.html(btnContent)
      // enable btn
      btn.removeClass('disabled').attr('disabled', false)

      $('#subdomainAvailable').hide()
      $('#subdomainNotAvailable').hide()
      $('#subdomainWaitStatus').fadeIn(100)
    }
  })



})


/*
  BUY WITH PAYPAL
*/

$('#pay').on('click', function(e) {

  e.preventDefault()

  var paymentType = $('.btn-pay.active').attr('data-payment-type')
  var url = '/buy/'+paymentType
  var voucher = $('input[name="voucher"]').val()
  var custom = $('input[name="custom"]').val()
  var offer = $(this).attr('data-offer')

  $('<form method="post" action="'+url+'"><input name="voucher" value="'+voucher+'"><input name="custom" value="'+custom+'"><input name="offer" value="'+offer+'"></form>').submit()

})
