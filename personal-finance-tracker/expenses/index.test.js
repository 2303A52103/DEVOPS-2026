const { totalExpenses } = require("./index");

test("calculates total expenses", () => {
  expect(totalExpenses([100, 200, 50])).toBe(350);
});
