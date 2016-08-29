module.exports = {
  calculateFees: function (amount) {

    var tax = (3.4 / 100) * (amount + 0.25);
		tax += 0.25;
		tax = Math.round(tax * 100) / 100;

    return tax

  }
}
