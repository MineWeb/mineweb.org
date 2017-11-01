module.exports = {
  calculateFees: function (amount) {

    var tax = (3.4 / 100) * (amount + 0.25);
		tax += 0.25;
		tax = Math.round(tax * 100) / 100;

    if (tax < 0)
      tax = amount

    return tax

  },
  round: function (amount) {
    return Math.round(amount * 100) / 100;
  }
}
