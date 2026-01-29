import React from "react";

import { useState } from "react";

function ProductCard({ product, setCartCount }) {
  const [count, setCount] = useState(0);

  const addToCart = () => {
    setCount(count + 1);
    setCartCount(prev => prev + 1);
  };

  return (
  <div className="group bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-300">
    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
      {product.name}
    </h3>

    <p className="text-sm text-gray-500 dark:text-gray-400">
      Premium quality product
    </p>

    <p className="mt-4 text-2xl font-bold text-indigo-600">
      ₹{product.price}
    </p>

    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
      Quantity: <span className="font-semibold">{count}</span>
    </p>

    <button
      onClick={addToCart}
      className="mt-5 w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-[1.02] text-white py-2.5 rounded-xl font-medium transition-all duration-300"
    >
      Add to Cart
    </button>
  </div>
);

}

export default ProductCard;
