import React, { createContext, useContext, useReducer } from "react";

const CartStateContext = createContext(null);
const CartDispatchContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const item = action.payload;
      const exists = state.find((i) => i.id === item.id);
      if (exists) {
        return state.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...state, { ...item, quantity: 1 }];
    }
    case "REMOVE":
      return state.filter((i) => i.id !== action.payload);
    case "DECREMENT":
      return state
        .map((i) => (i.id === action.payload ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))
        .filter((i) => i.quantity > 0);
    case "CLEAR":
      return [];
    default:
      throw new Error(`Unknown action: ${action && action.type}`);
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, []);

  return (
    <CartStateContext.Provider value={state}>
      <CartDispatchContext.Provider value={dispatch}>{children}</CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartStateContext);
  if (ctx === undefined) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export function useCartDispatch() {
  const ctx = useContext(CartDispatchContext);
  if (ctx === undefined) throw new Error("useCartDispatch must be used within a CartProvider");
  return ctx;
}

export function useCartActions() {
  const state = useCart();
  const dispatch = useCartDispatch();
  return {
    items: state,
    addItem: (item) => dispatch({ type: "ADD", payload: item }),
    removeItem: (id) => dispatch({ type: "REMOVE", payload: id }),
    decrementItem: (id) => dispatch({ type: "DECREMENT", payload: id }),
    clear: () => dispatch({ type: "CLEAR" }),
  };
}

export default CartProvider;
