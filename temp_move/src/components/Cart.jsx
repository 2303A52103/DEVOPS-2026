import { useCart, useCartActions } from "../context/CartContext";

function Cart() {
  const items = useCart();
  const { removeItem, addItem, decrementItem, clear } = useCartActions();

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div>
        <h2>Cart</h2>
        <p>Your shopping cart is empty.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Cart</h2>
      <p>Total items: {totalItems}</p>
      <ul>
        {items.map((it) => (
          <li key={it.id} style={{ marginBottom: 8 }}>
            {it.name} — qty: {it.quantity}
            <button style={{ marginLeft: 8 }} onClick={() => addItem(it)}>
              +
            </button>
            <button style={{ marginLeft: 4 }} onClick={() => decrementItem(it.id)}>
              -
            </button>
            <button style={{ marginLeft: 8 }} onClick={() => removeItem(it.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => clear()}>Clear Cart</button>
    </div>
  );
}

export default Cart;
