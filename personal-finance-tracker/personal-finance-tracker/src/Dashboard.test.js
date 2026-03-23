import { render, screen } from "@testing-library/react";

function Dashboard() {
  return <h1>Dashboard</h1>;
}

test("renders Dashboard heading", () => {
  render(<Dashboard />);
  expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
});