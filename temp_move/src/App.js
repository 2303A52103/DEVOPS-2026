import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";

import Home from "./components/Home";
import Products from "./components/Products";
import ProductDetail from "./components/ProductDetail";
import Cart from "./components/Cart";
import NavBar from "./components/NavBar";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <NavBar />

        <div style={{ padding: "20px" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />

            {/* Nested Routes */}
            <Route path="/products" element={<Products />}>
              <Route path=":id" element={<ProductDetail />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;