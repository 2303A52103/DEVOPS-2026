import { Link, Outlet } from "react-router-dom";

const products = [
  { id: 1, name: "Laptop" },
  { id: 2, name: "Mobile Phone" },
  { id: 3, name: "Headphones" },
];

function Products() {
  return (
    <div>
      <h2>Products</h2>

      <ul>
        {products.map((p) => (
          <li key={p.id}>
            <Link to={`${p.id}`}>{p.name}</Link>
          </li>
        ))}
      </ul>

      {/* Nested route will render here */}
      <Outlet />
    </div>
  );
}

export default Products;
