import { Link, Outlet } from "react-router-dom";
import products from "../data/products";
import { useCartActions } from "../context/CartContext";

function Products() {
  const { addItem } = useCartActions();

  return (
    <div>
      <h2>Products</h2>

      <div style={{ display: "grid", gap: 12 }}>
        {products.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 8,
              borderBottom: "1px solid #eee",
            }}
          >
            <img
              src={p.image}
              alt={p.name}
              style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 6 }}
            />

            <div style={{ flex: 1 }}>
              <div>
                <Link to={`${p.id}`} style={{ fontSize: 16, fontWeight: 600 }}>
                  {p.name}
                </Link>
              </div>
              <div style={{ marginTop: 6 }}>
                <button onClick={() => addItem(p)}>Add to cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nested route will render here */}
      <div style={{ marginTop: 18 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default Products;
