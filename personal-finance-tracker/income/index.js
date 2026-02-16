function totalIncome(values) {
  return values.reduce((a, b) => a + b, 0);
}

module.exports = { totalIncome };
