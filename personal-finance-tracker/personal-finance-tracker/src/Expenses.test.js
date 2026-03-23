import { render, screen } from "@testing-library/react";

function Expenses () {
  return <h1>Expenses</h1>;
}

test("renders Expenses heading", () => {
  render(<Expenses />);
  expect(screen.getByText(/Expenses/i)).toBeInTheDocument();
});