import React from "react";

import ProductCard from "./ProductCard.jsx";

function ProductList({ setCartCount }) {
  const products = [
    { id: 1, name: "Laptop", price: 60000 },
    { id: 2, name: "Mobile", price: 30000 },
    { id: 3, name: "Headphones", price: 2000 }
  ];

  return (
    <div className="grid gap-8 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          setCartCount={setCartCount}
        />
      ))}
    </div>
  );
}

export default ProductList;

