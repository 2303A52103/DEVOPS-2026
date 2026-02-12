const { totalIncome } = require("./index");

test("calculates total income", () => {
  expect(totalIncome([500, 800])).toBe(1300);
});
