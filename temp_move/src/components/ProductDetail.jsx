import { useParams } from "react-router-dom";
import products from "../data/products";
import { useCartActions } from "../context/CartContext";

function ProductDetail() {
  const { id } = useParams();
  const prodId = Number(id);
  const product = products.find((p) => p.id === prodId);
  const { addItem } = useCartActions();

  if (!product) return <div style={{ marginTop: "20px" }}>Product not found.</div>;

  return (
    <div style={{ marginTop: "20px", display: "flex", gap: 20 }}>
      <img
        src={product.image}
        alt={product.name}
        style={{ width: 300, height: 220, objectFit: "cover", borderRadius: 6 }}
      />

      <div>
        <h3>Product Details</h3>
        <h4>{product.name}</h4>
        <p>{product.description}</p>
        <p>Viewing details for product ID: {id}</p>
        <button onClick={() => addItem(product)}>Add to cart</button>
      </div>
    </div>
  );
}

export default ProductDetail;
