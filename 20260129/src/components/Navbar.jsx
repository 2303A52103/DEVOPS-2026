import React from "react";

import { Moon, Sun, ShoppingCart } from "lucide-react";

function Navbar({ cartCount, darkMode, toggleDark }) {
  return (
  <nav className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
        ShopEase
      </h1>

      <div className="flex items-center gap-6">
        {/* Cart */}
        <div className="relative">
          <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
            {cartCount}
          </span>
        </div>

        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {darkMode ? (
            <Sun className="text-yellow-400" />
          ) : (
            <Moon className="text-gray-700 dark:text-gray-200" />
          )}
        </button>
      </div>
    </div>
  </nav>
);

}

export default Navbar;
