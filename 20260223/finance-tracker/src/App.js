import React, { useEffect, useState } from "react";

function App() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => console.error("Error:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Finance Tracker</h1>
      <ul>
        {transactions.map((tx) => (
          <li key={tx.id}>
            ₹{tx.amount} - {tx.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;