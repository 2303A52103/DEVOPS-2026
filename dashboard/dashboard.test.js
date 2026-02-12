const { calculateBalance } = require("./dashboard.service");

test("calculates balance correctly", () => {
  expect(calculateBalance(50000, 30000)).toBe(20000);
});

test("returns zero when income equals expenses", () => {
  expect(calculateBalance(1000, 1000)).toBe(0);
});

test("returns negative when expenses exceed income", () => {
  expect(calculateBalance(2000, 3000)).toBe(-1000);
});
