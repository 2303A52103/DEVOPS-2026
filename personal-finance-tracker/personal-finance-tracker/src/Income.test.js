import { render, screen } from "@testing-library/react";

function Income() {
  return <h1>Income</h1>;
}

test("renders Income heading", () => {
  render(<Income />);
  expect(screen.getByText(/Income/i)).toBeInTheDocument();
});