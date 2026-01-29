import React from "react";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import ProductList from "./components/ProductList.jsx";

function App() {
  const [cartCount, setCartCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <Navbar
        cartCount={cartCount}
        darkMode={darkMode}
        toggleDark={() => setDarkMode(!darkMode)}
      />

      {/* Page container */}
      <div className="max-w-7xl mx-auto">
        <ProductList setCartCount={setCartCount} />
      </div>
    </div>
  );
}

export default App;
