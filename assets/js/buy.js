$('.btn-pay').on('click', function(e) {
  e.preventDefault()

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

})
