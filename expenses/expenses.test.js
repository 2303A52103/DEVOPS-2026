const { addExpense } = require("./expenses.service");

test("adds expense correctly", () => {
  expect(addExpense(1000, 500)).toBe(1500);
});
