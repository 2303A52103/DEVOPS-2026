import { useParams } from "react-router-dom";

function ProductDetail() {
  const { id } = useParams();

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Product Details</h3>
      <p>Viewing details for product ID: {id}</p>
    </div>
  );
}

export default ProductDetail;